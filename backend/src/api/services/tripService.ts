import type { QueryDeepPartialEntity } from 'typeorm';
import { AppDataSource } from '../../config/data-source';
import { Trip } from '../../entities/Trip';
import { TripStop } from '../../entities/TripStop';
import type { Place } from '../../entities/Place';
import { fetchAndUpsertPlaces } from './placeService';
import { curatePlaces } from './claudeService';
import { clusterPlacesByDay } from '../../utils/clustering';
import type { TripDayResponse, TripGenerateResponse, TripPreferences, TripStopResponse } from '../../types/trip';

const MAX_TRIP_DAYS = 14;
const PLACES_PER_DAY_TARGET = 5;
const MIN_PLACES_TARGET = 20;

// Pre-curation fetch pool: scales with trip length instead of a flat ~90-100, so short
// trips don't pay for a maximal Google fetch they don't need. Capped at FETCH_POOL_MAX on
// the normal path (attempt 0); retries deliberately escalate past that cap (see below),
// since the whole point of retrying is asking Google for more than the normal ceiling.
const FETCH_POOL_PER_DAY = 10;
const FETCH_POOL_MIN = 60;
const FETCH_POOL_MAX = 100;
const RETRY_FETCH_INCREMENT = 40;

// 1 initial attempt + 2 retries. Each attempt is a full Google pagination round plus a
// Claude call, so diminishing returns kick in fast — if two pool enlargements don't help,
// the city/preference combination genuinely doesn't have enough matching places.
const MAX_CURATION_ATTEMPTS = 3;

// Pure and exported for unit testing — same pattern as placeService.ts's perQueryTarget.
export function computeFetchPoolSize(dayCount: number, attempt: number): number {
  const base = Math.min(Math.max(dayCount * FETCH_POOL_PER_DAY, FETCH_POOL_MIN), FETCH_POOL_MAX);
  return base + attempt * RETRY_FETCH_INCREMENT;
}

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

  let curatedPlaces: Place[] = [];
  let previousCandidateCount = -1;

  for (let attempt = 0; attempt < MAX_CURATION_ATTEMPTS; attempt++) {
    const fetchPoolSize = computeFetchPoolSize(days.length, attempt);
    const candidatePlaces = await fetchAndUpsertPlaces(city, fetchPoolSize, preferences.interests);

    if (attempt > 0 && candidatePlaces.length <= previousCandidateCount) {
      // Google has nothing further to offer for this city/query set — re-running curation
      // on an unchanged pool won't help, so stop escalating and keep the previous attempt's
      // curated result.
      console.warn(
        `Google returned no additional candidates for ${city} on retry ${attempt}; stopping retries early.`,
      );
      break;
    }
    previousCandidateCount = candidatePlaces.length;

    // Any failure here (network, refusal, malformed output) throws and propagates
    // immediately — this loop only reacts to a *successful* call whose output was too
    // small; it never retries an actual Claude/API failure.
    curatedPlaces = await curatePlaces(candidatePlaces, preferences, days.length);

    if (curatedPlaces.length >= targetPlaceCount) {
      break;
    }
    if (attempt === MAX_CURATION_ATTEMPTS - 1) {
      // Proceed anyway rather than throwing — a thinner-than-ideal but real itinerary is a
      // better outcome than a 500, and clustering already tolerates sparse input.
      console.warn(
        `Curated pool (${curatedPlaces.length}) is below the target (${targetPlaceCount}) for ${city} ` +
          `after ${MAX_CURATION_ATTEMPTS} attempts; proceeding with what Claude returned.`,
      );
    }
  }

  const placesByDay = clusterPlacesByDay(curatedPlaces, days);

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
