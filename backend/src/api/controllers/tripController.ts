import { Request, Response } from 'express';
import { generateTrip, getTripById, listTripsByOwner, deleteTrip, InvalidTripDateRangeError } from '../services/tripService';
import type { TripGenerateRequest, TripPreferences } from '../../types/trip';

const VALID_VIBES = new Set<TripPreferences['vibe']>(['relaxed', 'moderate', 'packed']);
const VALID_INTERESTS = new Set<TripPreferences['interests'][number]>([
  'museums',
  'food',
  'nature',
  'nightlife',
  'shopping',
]);
const VALID_GROUP_TYPES = new Set<TripPreferences['groupType']>(['solo', 'couple', 'family', 'friends']);
const VALID_BUDGETS = new Set<TripPreferences['budget']>(['budget', 'mid-range', 'luxury']);

export const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class InvalidTripStartDateError extends Error {}

// Comparing against UTC-yesterday (not UTC-today) gives a client behind UTC a full day
// of slack so their genuine local "today" is never wrongly rejected.
export function assertStartDateNotInPast(startDate: string): void {
  const yesterday = new Date();
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const earliestValidDate = yesterday.toISOString().slice(0, 10);
  if (startDate < earliestValidDate) {
    throw new InvalidTripStartDateError('Start date cannot be before today.');
  }
}

// Real request boundary — don't trust the wizard's own client-side validation.
// Exported so vacationController.ts's "add a city" handler can reuse this.
export function isValidPreferences(value: unknown): value is TripPreferences {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const { vibe, interests, groupType, budget } = value as Partial<TripPreferences>;
  return (
    typeof vibe === 'string' &&
    VALID_VIBES.has(vibe as TripPreferences['vibe']) &&
    Array.isArray(interests) &&
    // Bounded and deduped — otherwise a duplicated array would turn into that many
    // sequential Google Places calls, one real API request per entry.
    interests.length <= VALID_INTERESTS.size &&
    new Set(interests).size === interests.length &&
    interests.every((interest) => VALID_INTERESTS.has(interest)) &&
    typeof groupType === 'string' &&
    VALID_GROUP_TYPES.has(groupType as TripPreferences['groupType']) &&
    typeof budget === 'string' &&
    VALID_BUDGETS.has(budget as TripPreferences['budget'])
  );
}

export async function generateTripHandler(req: Request, res: Response): Promise<void> {
  const { city, startDate, endDate, preferences } = req.body as Partial<TripGenerateRequest>;

  if (typeof city !== 'string' || !city.trim()) {
    res.status(400).json({ error: 'city is required' });
    return;
  }
  if (typeof startDate !== 'string' || typeof endDate !== 'string') {
    res.status(400).json({ error: 'startDate and endDate are required' });
    return;
  }
  if (!isValidPreferences(preferences)) {
    res.status(400).json({ error: 'preferences is required and must include a valid vibe, interests, groupType, and budget' });
    return;
  }

  try {
    assertStartDateNotInPast(startDate);
    const trip = await generateTrip(city.trim(), startDate, endDate, preferences, req.userId);
    res.json(trip);
  } catch (error) {
    if (error instanceof InvalidTripDateRangeError || error instanceof InvalidTripStartDateError) {
      res.status(400).json({ error: error.message });
      return;
    }
    console.error('Failed to generate trip', error);
    res.status(500).json({ error: 'Failed to generate trip' });
  }
}

export async function getTripHandler(req: Request, res: Response): Promise<void> {
  // Trip.id is a uuid column — a malformed id would otherwise reach Postgres and throw a
  // type error the catch block can't distinguish from a real failure.
  if (!UUID_PATTERN.test(req.params.id)) {
    res.status(404).json({ error: 'Trip not found' });
    return;
  }

  try {
    const trip = await getTripById(req.params.id, req.userId);
    if (!trip) {
      res.status(404).json({ error: 'Trip not found' });
      return;
    }
    res.json(trip);
  } catch (error) {
    console.error('Failed to load trip', error);
    res.status(500).json({ error: 'Failed to load trip' });
  }
}

export async function listTripsHandler(req: Request, res: Response): Promise<void> {
  try {
    const trips = await listTripsByOwner(req.userId);
    res.json(trips);
  } catch (error) {
    console.error('Failed to list trips', error);
    res.status(500).json({ error: 'Failed to list trips' });
  }
}

export async function deleteTripHandler(req: Request, res: Response): Promise<void> {
  if (!UUID_PATTERN.test(req.params.id)) {
    res.status(404).json({ error: 'Trip not found' });
    return;
  }

  try {
    const deleted = await deleteTrip(req.params.id, req.userId);
    if (!deleted) {
      res.status(404).json({ error: 'Trip not found' });
      return;
    }
    res.status(204).send();
  } catch (error) {
    console.error('Failed to delete trip', error);
    res.status(500).json({ error: 'Failed to delete trip' });
  }
}
