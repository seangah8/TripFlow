import type { QueryDeepPartialEntity } from 'typeorm';
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

interface StopDraft {
  date: string;
  order: number;
  place: Place;
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

  // Each draft carries its own `place` directly, so the response's stop-to-place
  // pairing never depends on database round-trip ordering — only the generated
  // id (below) does.
  const stopDrafts: StopDraft[] = [];
  for (const date of days) {
    const dayPlaces = placesByDay.get(date)!;
    dayPlaces.forEach((place, orderIndex) => {
      stopDrafts.push({ date, order: orderIndex + 1, place });
    });
  }

  const tripStopRepository = AppDataSource.getRepository(TripStop);
  const stopEntities = stopDrafts.map((draft) =>
    tripStopRepository.create({
      tripId: trip.id,
      placeId: draft.place.id,
      date: draft.date,
      order: draft.order,
      estimatedMinutes: null,
      reasoning: null,
    }),
  );

  // insert() issues one real multi-row INSERT (unlike save(), which issues one
  // INSERT per entity) — Postgres's RETURNING clause preserves the input VALUES
  // order, so identifiers[i] reliably corresponds to stopEntities[i]/stopDrafts[i].
  // Cast needed for the same reason as placeService.ts's upsert() call: TypeORM's
  // QueryDeepPartialEntity recurses into jsonb-typed relations (Place.openingHours)
  // in a way that doesn't line up with the entity instances created above.
  const insertResult = await tripStopRepository.insert(stopEntities as QueryDeepPartialEntity<TripStop>[]);

  const stopsByDay = new Map<string, TripStopResponse[]>(days.map((date) => [date, []]));
  stopDrafts.forEach((draft, index) => {
    stopsByDay.get(draft.date)!.push({
      tripStopId: insertResult.identifiers[index]!.id as string,
      order: draft.order,
      place: draft.place,
      estimatedMinutes: null,
      reasoning: null,
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
