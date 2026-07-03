import type { QueryDeepPartialEntity } from 'typeorm';
import { AppDataSource } from '../../config/data-source';
import { Trip } from '../../entities/Trip';
import { TripStop } from '../../entities/TripStop';
import type { Place } from '../../entities/Place';
import { fetchAndUpsertPlaces } from './placeService';
import { clusterPlacesByDay } from '../../utils/clustering';
import type { TripDayResponse, TripGenerateResponse, TripPreferences, TripStopResponse } from '../../types/trip';

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

interface StopDraft {
  date: string;
  order: number;
  place: Place;
}

export async function generateTrip(
  city: string,
  startDate: string,
  endDate: string,
  preferences: TripPreferences,
): Promise<TripGenerateResponse> {
  const days = getDateRange(startDate, endDate);
  const targetPlaceCount = Math.max(days.length * PLACES_PER_DAY_TARGET, MIN_PLACES_TARGET);

  const places = await fetchAndUpsertPlaces(city, targetPlaceCount, preferences.interests);
  const placesByDay = clusterPlacesByDay(places, days);

  const tripRepository = AppDataSource.getRepository(Trip);
  const trip = await tripRepository.save(
    tripRepository.create({ city, startDate, endDate, preferences }),
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

// Reconstructs the exact TripGenerateResponse shape from persisted rows — lets
// GET /api/trips/:id (v4, pulled forward from v7) serve the same contract a
// fresh generate returns, so the frontend doesn't need two response shapes.
export async function getTripById(tripId: string): Promise<TripGenerateResponse | null> {
  const tripRepository = AppDataSource.getRepository(Trip);
  const trip = await tripRepository.findOne({ where: { id: tripId } });
  if (!trip) {
    return null;
  }

  const days = getDateRange(trip.startDate, trip.endDate);

  const tripStopRepository = AppDataSource.getRepository(TripStop);
  const stops = await tripStopRepository.find({
    where: { tripId },
    relations: { place: true },
    order: { date: 'ASC', order: 'ASC' },
  });

  const stopsByDay = new Map<string, TripStopResponse[]>(days.map((date) => [date, []]));
  for (const stop of stops) {
    stopsByDay.get(stop.date)!.push({
      tripStopId: stop.id,
      order: stop.order,
      place: stop.place,
      estimatedMinutes: stop.estimatedMinutes,
      reasoning: stop.reasoning,
    });
  }

  const responseDays: TripDayResponse[] = days.map((date) => ({
    date,
    stops: stopsByDay.get(date)!,
  }));

  return {
    tripId: trip.id,
    city: trip.city,
    startDate: trip.startDate,
    endDate: trip.endDate,
    days: responseDays,
  };
}
