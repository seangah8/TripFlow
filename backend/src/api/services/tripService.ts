import { AppDataSource } from '../../config/data-source';
import { Trip } from '../../entities/Trip';
import { TripStop } from '../../entities/TripStop';
import type { Place } from '../../entities/Place';
import { fetchAndUpsertPlaces } from './placeService';
import type { TripDayResponse, TripGenerateResponse, TripStopResponse } from '../../types/trip';

const MAX_TRIP_DAYS = 14;
const PLACES_PER_DAY_TARGET = 5;
const MIN_PLACES_TARGET = 20;

// Thrown for bad request data — tripController.ts catches this specifically
// to respond 400 instead of 500.
export class InvalidTripDateRangeError extends Error {}

function parseDateOnly(dateStr: string): Date {
  // Native <input type="date"> always sends YYYY-MM-DD, but the backend is a
  // real request boundary — validate the format defensively rather than
  // trusting the frontend's own validation.
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    throw new InvalidTripDateRangeError(`Invalid date: ${dateStr}`);
  }
  const date = new Date(`${dateStr}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) {
    throw new InvalidTripDateRangeError(`Invalid date: ${dateStr}`);
  }
  return date;
}

// Every calendar date from startDate to endDate inclusive, as YYYY-MM-DD strings.
function getDateRange(startDate: string, endDate: string): string[] {
  const start = parseDateOnly(startDate);
  const end = parseDateOnly(endDate);
  if (end < start) {
    throw new InvalidTripDateRangeError('endDate must be on or after startDate');
  }

  const dates: string[] = [];
  const current = new Date(start);
  while (current <= end) {
    dates.push(current.toISOString().slice(0, 10));
    current.setUTCDate(current.getUTCDate() + 1);
  }

  if (dates.length > MAX_TRIP_DAYS) {
    throw new InvalidTripDateRangeError(`Trip length cannot exceed ${MAX_TRIP_DAYS} days`);
  }

  return dates;
}

// Deterministic round-robin: place i goes to day (i % totalDays), so reruns
// of the same fetched pool always land on the same days. Real geographic
// clustering replaces this in v3.
function splitPlacesByDay(places: Place[], days: string[]): Map<string, Place[]> {
  const placesByDay = new Map<string, Place[]>(days.map((date) => [date, []]));
  places.forEach((place, index) => {
    const date = days[index % days.length];
    placesByDay.get(date)!.push(place);
  });
  return placesByDay;
}

export async function generateTrip(city: string, startDate: string, endDate: string): Promise<TripGenerateResponse> {
  const days = getDateRange(startDate, endDate);
  const targetPlaceCount = Math.max(days.length * PLACES_PER_DAY_TARGET, MIN_PLACES_TARGET);

  const places = await fetchAndUpsertPlaces(city, targetPlaceCount);
  const placesByDay = splitPlacesByDay(places, days);

  const tripRepository = AppDataSource.getRepository(Trip);
  const trip = await tripRepository.save(
    tripRepository.create({ city, startDate, endDate, preferences: null }),
  );

  const tripStopRepository = AppDataSource.getRepository(TripStop);
  // Built as one flat array (day, order, place) so a single batch insert can
  // create every stop for the trip, then re-grouped into the response's
  // per-day shape once TypeORM hands back the saved rows (with ids).
  const stopPlaces: Place[] = [];
  const stopEntities: TripStop[] = [];
  for (const date of days) {
    const dayPlaces = placesByDay.get(date)!;
    dayPlaces.forEach((place, orderIndex) => {
      stopPlaces.push(place);
      stopEntities.push(
        tripStopRepository.create({
          tripId: trip.id,
          placeId: place.id,
          date,
          order: orderIndex + 1,
          estimatedMinutes: null,
          reasoning: null,
        }),
      );
    });
  }
  const savedStops = await tripStopRepository.save(stopEntities);

  const stopsByDay = new Map<string, TripStopResponse[]>(days.map((date) => [date, []]));
  savedStops.forEach((stop, index) => {
    stopsByDay.get(stop.date)!.push({
      tripStopId: stop.id,
      order: stop.order,
      place: stopPlaces[index],
      estimatedMinutes: stop.estimatedMinutes,
      reasoning: stop.reasoning,
    });
  });

  const responseDays: TripDayResponse[] = days.map((date) => ({
    date,
    stops: stopsByDay.get(date)!,
  }));

  return {
    tripId: trip.id,
    city,
    startDate,
    endDate,
    days: responseDays,
  };
}
