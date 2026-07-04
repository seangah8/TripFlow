import { In } from 'typeorm';
import { AppDataSource } from '../../config/data-source';
import { Vacation } from '../../entities/Vacation';
import { Trip } from '../../entities/Trip';
import { generateTrip, getFirstStopPhotoByTripId } from './tripService';
import { assertStartDateNotInPast } from '../controllers/tripController';
import type { TripGenerateResponse, TripPreferences, TripSummaryResponse } from '../../types/trip';
import type { VacationResponse } from '../../types/vacation';

export async function createVacation(name: string | undefined, ownerId: string): Promise<VacationResponse> {
  const vacationRepository = AppDataSource.getRepository(Vacation);
  const vacation = await vacationRepository.save(
    vacationRepository.create({ name: name?.trim() || null, ownerId }),
  );
  return { vacationId: vacation.id, name: vacation.name, createdAt: vacation.createdAt.toISOString(), trips: [] };
}

export class TripDateConflictError extends Error {}

// Inclusive-range overlap on two YYYY-MM-DD strings.
export function dateRangesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return aStart <= bEnd && bStart <= aEnd;
}

// Checks ownership BEFORE invoking the expensive Places/Claude pipeline, so an
// invalid/unowned vacationId never triggers wasted external API calls. Returns
// null (not a thrown error) so the controller can 404, matching getTripById's
// null convention. Every other check (past-date, overlap) runs after ownership —
// an unowned vacationId must always 404 regardless of what else is wrong with
// the request, not surface a different error first — but before generateTrip
// (neither a bad date nor a conflicting range should trigger a wasted Places/
// Claude call).
export async function addTripToVacation(
  vacationId: string,
  city: string,
  startDate: string,
  endDate: string,
  preferences: TripPreferences,
  ownerId: string,
): Promise<TripGenerateResponse | null> {
  const vacationRepository = AppDataSource.getRepository(Vacation);
  const vacation = await vacationRepository.findOne({ where: { id: vacationId, ownerId } });
  if (!vacation) {
    return null;
  }

  assertStartDateNotInPast(startDate);

  const tripRepository = AppDataSource.getRepository(Trip);
  const siblingTrips = await tripRepository.find({ where: { vacationId } });
  const conflict = siblingTrips.find((sibling) => dateRangesOverlap(startDate, endDate, sibling.startDate, sibling.endDate));
  if (conflict) {
    throw new TripDateConflictError(
      `These dates overlap with your existing trip to ${conflict.city} (${conflict.startDate} – ${conflict.endDate}).`,
    );
  }

  return generateTrip(city, startDate, endDate, preferences, ownerId, vacationId);
}

// Dashboard card list — one query for vacations, one grouped query for all their
// trips (city/dates only, no place/stop join), avoiding both an eager relation
// and an N+1 per-vacation trip query.
export async function listVacationsByOwner(ownerId: string): Promise<VacationResponse[]> {
  const vacationRepository = AppDataSource.getRepository(Vacation);
  const vacations = await vacationRepository.find({ where: { ownerId }, order: { createdAt: 'DESC' } });
  if (vacations.length === 0) {
    return [];
  }

  const tripRepository = AppDataSource.getRepository(Trip);
  const trips = await tripRepository.find({
    where: { vacationId: In(vacations.map((vacation) => vacation.id)) },
    order: { createdAt: 'ASC' },
  });

  const photoByTripId = await getFirstStopPhotoByTripId(trips.map((trip) => trip.id));

  const tripsByVacationId = new Map<string, TripSummaryResponse[]>(vacations.map((vacation) => [vacation.id, []]));
  for (const trip of trips) {
    tripsByVacationId.get(trip.vacationId!)!.push({
      tripId: trip.id,
      city: trip.city,
      startDate: trip.startDate,
      endDate: trip.endDate,
      photoName: photoByTripId.get(trip.id) ?? null,
    });
  }

  return vacations.map((vacation) => ({
    vacationId: vacation.id,
    name: vacation.name,
    createdAt: vacation.createdAt.toISOString(),
    trips: tripsByVacationId.get(vacation.id)!,
  }));
}

// Vacation hub — nests lightweight trip summaries (city/dates only); a trip's
// full itinerary is fetched separately via the existing GET /api/trips/:id.
export async function getVacationById(vacationId: string, ownerId: string): Promise<VacationResponse | null> {
  const vacationRepository = AppDataSource.getRepository(Vacation);
  const vacation = await vacationRepository.findOne({ where: { id: vacationId, ownerId } });
  if (!vacation) {
    return null;
  }

  const tripRepository = AppDataSource.getRepository(Trip);
  const trips = await tripRepository.find({ where: { vacationId }, order: { createdAt: 'ASC' } });
  const photoByTripId = await getFirstStopPhotoByTripId(trips.map((trip) => trip.id));

  return {
    vacationId: vacation.id,
    name: vacation.name,
    createdAt: vacation.createdAt.toISOString(),
    trips: trips.map((trip) => ({
      tripId: trip.id,
      city: trip.city,
      startDate: trip.startDate,
      endDate: trip.endDate,
      photoName: photoByTripId.get(trip.id) ?? null,
    })),
  };
}
