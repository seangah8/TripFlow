import type { QueryDeepPartialEntity } from 'typeorm';
import { AppDataSource } from '../../config/data-source';
import { Trip } from '../../entities/Trip';
import { TripStop } from '../../entities/TripStop';
import type { Place } from '../../entities/Place';
import { fetchAndUpsertPlaces } from './placeService';
import { curatePlaces, ClaudeCurationError } from './claudeService';
import { clusterPlacesByDay } from '../../utils/clustering';
import type {
  TripDayResponse,
  TripGenerateResponse,
  TripPreferences,
  TripStopResponse,
  TripSummaryResponse,
} from '../../types/trip';
import type { CuratedStop, CurationResult } from '../../types/claudeCuration';

const MAX_TRIP_DAYS = 14;
const PLACES_PER_DAY_TARGET = 5;
const MIN_PLACES_TARGET = 20;

// Pre-curation fetch pool: scales with trip length so short trips don't pay for a maximal
// Google fetch. Capped at FETCH_POOL_MAX on the normal path; retries escalate past that cap.
const FETCH_POOL_PER_DAY = 10;
const FETCH_POOL_MIN = 60;
const FETCH_POOL_MAX = 100;
const RETRY_FETCH_INCREMENT = 40;

// 1 initial attempt + 2 retries. Each attempt is a full Google pagination round plus a
// Claude call, so diminishing returns kick in fast.
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
  // The backend is a real request boundary — validate the format defensively
  // rather than trusting the frontend's own validation.
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
  estimatedMinutes: number;
  reasoning: string;
}

export async function generateTrip(
  city: string,
  startDate: string,
  endDate: string,
  preferences: TripPreferences,
  ownerId: string,
  vacationId?: string,
): Promise<TripGenerateResponse> {
  const days = getDateRange(startDate, endDate);
  const targetPlaceCount = Math.max(days.length * PLACES_PER_DAY_TARGET, MIN_PLACES_TARGET);

  let bestCuratedStops: CuratedStop[] = [];
  // Tracked alongside bestCuratedStops so the cover photo always matches whichever
  // attempt's curated stops actually won — not necessarily the last attempt run.
  let bestCoverPhotoName: string | null = null;
  let previousCandidateCount = -1;

  for (let attempt = 0; attempt < MAX_CURATION_ATTEMPTS; attempt++) {
    const fetchPoolSize = computeFetchPoolSize(days.length, attempt);
    const candidatePlaces = await fetchAndUpsertPlaces(city, fetchPoolSize, preferences.interests);

    if (attempt > 0 && candidatePlaces.length <= previousCandidateCount) {
      // Google has nothing further to offer this city/query set — stop escalating
      // and keep the best result found so far.
      console.warn(
        `Google returned no additional candidates for ${city} on retry ${attempt}; stopping retries early.`,
      );
      break;
    }
    previousCandidateCount = candidatePlaces.length;

    let curationResult: CurationResult;
    try {
      curationResult = await curatePlaces(candidatePlaces, preferences, days.length);
    } catch (error) {
      // A retry's failure shouldn't discard an already-usable earlier result — keep the
      // best found so far. With nothing usable yet, there's no fallback, so it propagates.
      if (bestCuratedStops.length === 0) {
        throw error;
      }
      console.warn(`Curation retry ${attempt} for ${city} failed; keeping the best result found so far.`, error);
      break;
    }

    // Curation is non-deterministic, so a later attempt can return fewer places than
    // an earlier one — keep the largest result seen across attempts.
    if (curationResult.stops.length > bestCuratedStops.length) {
      bestCuratedStops = curationResult.stops;
      bestCoverPhotoName = curationResult.coverPhotoName;
    }

    if (bestCuratedStops.length >= targetPlaceCount) {
      break;
    }
    if (attempt === MAX_CURATION_ATTEMPTS - 1) {
      // Proceed anyway rather than throwing — a thinner-than-ideal but real itinerary is a
      // better outcome than a 500, and clustering already tolerates sparse input.
      console.warn(
        `Curated pool (${bestCuratedStops.length}) is below the target (${targetPlaceCount}) for ${city} ` +
          `after ${MAX_CURATION_ATTEMPTS} attempts; proceeding with what Claude returned.`,
      );
    }
  }

  if (bestCuratedStops.length === 0) {
    // Every attempt curated down to nothing usable — a curation failure, not a
    // legitimately thin trip, so it fails loudly instead of persisting an empty itinerary.
    throw new ClaudeCurationError(`Claude curated zero usable places for ${city} after ${MAX_CURATION_ATTEMPTS} attempt(s)`);
  }

  // clustering.ts's contract stays Place[]-only — per-stop details are re-attached
  // below, after clustering assigns each place to a day.
  const bestCuratedPlaces = bestCuratedStops.map((stop) => stop.place);
  const detailsByPlaceId = new Map(
    bestCuratedStops.map((stop) => [stop.place.googlePlaceId, { estimatedMinutes: stop.estimatedMinutes, reasoning: stop.reasoning }]),
  );
  const placesByDay = clusterPlacesByDay(bestCuratedPlaces, days);

  // Each draft carries its own `place` directly, so the stop-to-place pairing
  // never depends on database round-trip ordering. Built before the Trip row so its
  // (date, order)-sequenced first entry is available as the cover-photo fallback below.
  const stopDrafts: StopDraft[] = [];
  for (const date of days) {
    const dayPlaces = placesByDay.get(date)!;
    dayPlaces.forEach((place, orderIndex) => {
      // Non-null assertion is safe: every place in placesByDay traces back to
      // bestCuratedStops, which is exactly what detailsByPlaceId was built from.
      const details = detailsByPlaceId.get(place.googlePlaceId)!;
      stopDrafts.push({ date, order: orderIndex + 1, place, ...details });
    });
  }

  // Claude's iconic pick wins if it resolved to a real kept place; otherwise fall back
  // to the very first stop by (date, order) — stopDrafts is already in that sequence.
  const coverPhotoName = bestCoverPhotoName ?? stopDrafts[0]?.place.photoName ?? null;

  const tripRepository = AppDataSource.getRepository(Trip);
  const trip = await tripRepository.save(
    tripRepository.create({
      city,
      startDate,
      endDate,
      preferences,
      ownerId,
      vacationId: vacationId ?? null,
      photoName: coverPhotoName,
    }),
  );

  const tripStopRepository = AppDataSource.getRepository(TripStop);
  const stopEntities = stopDrafts.map((draft) =>
    tripStopRepository.create({
      tripId: trip.id,
      placeId: draft.place.id,
      date: draft.date,
      order: draft.order,
      estimatedMinutes: draft.estimatedMinutes,
      reasoning: draft.reasoning,
    }),
  );

  // insert() issues one multi-row INSERT; Postgres's RETURNING clause preserves input order.
  // Cast needed since TypeORM's QueryDeepPartialEntity mishandles the jsonb openingHours relation.
  const insertResult = await tripStopRepository.insert(stopEntities as QueryDeepPartialEntity<TripStop>[]);

  const stopsByDay = new Map<string, TripStopResponse[]>(days.map((date) => [date, []]));
  stopDrafts.forEach((draft, index) => {
    stopsByDay.get(draft.date)!.push({
      tripStopId: insertResult.identifiers[index]!.id as string,
      order: draft.order,
      place: draft.place,
      estimatedMinutes: draft.estimatedMinutes,
      reasoning: draft.reasoning,
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

// Reconstructs the exact TripGenerateResponse shape from persisted rows, so the
// frontend doesn't need two response shapes for generate vs. fetch.
export async function getTripById(tripId: string, ownerId: string): Promise<TripGenerateResponse | null> {
  const tripRepository = AppDataSource.getRepository(Trip);
  const trip = await tripRepository.findOne({ where: { id: tripId, ownerId } });
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

export async function deleteTrip(tripId: string, ownerId: string): Promise<boolean> {
  const tripRepository = AppDataSource.getRepository(Trip);
  const result = await tripRepository.delete({ id: tripId, ownerId });
  return (result.affected ?? 0) > 0;
}

// Dashboard card list — no trip_stops join at all: Trip.photoName is resolved once at
// generation time (see generateTrip), so the cover photo is just a column read here.
export async function listTripsByOwner(ownerId: string): Promise<TripSummaryResponse[]> {
  const tripRepository = AppDataSource.getRepository(Trip);
  const trips = await tripRepository.find({
    where: { ownerId },
    order: { createdAt: 'DESC' },
  });

  return trips.map((trip) => ({
    tripId: trip.id,
    city: trip.city,
    startDate: trip.startDate,
    endDate: trip.endDate,
    photoName: trip.photoName,
  }));
}
