import { Request, Response } from 'express';
import {
  createVacation,
  addTripToVacation,
  listVacationsByOwner,
  getVacationById,
  TripDateConflictError,
} from '../services/vacationService';
import { InvalidTripDateRangeError } from '../services/tripService';
import { isValidPreferences, UUID_PATTERN, InvalidTripStartDateError } from './tripController';
import type { TripGenerateRequest } from '../../types/trip';
import type { VacationCreateRequest } from '../../types/vacation';

export async function createVacationHandler(req: Request, res: Response): Promise<void> {
  const { name } = req.body as Partial<VacationCreateRequest>;

  if (name !== undefined && typeof name !== 'string') {
    res.status(400).json({ error: 'name must be a string' });
    return;
  }

  try {
    const vacation = await createVacation(name, req.userId);
    res.status(201).json(vacation);
  } catch (error) {
    console.error('Failed to create vacation', error);
    res.status(500).json({ error: 'Failed to create vacation' });
  }
}

export async function listVacationsHandler(req: Request, res: Response): Promise<void> {
  try {
    const vacations = await listVacationsByOwner(req.userId);
    res.json(vacations);
  } catch (error) {
    console.error('Failed to list vacations', error);
    res.status(500).json({ error: 'Failed to list vacations' });
  }
}

export async function getVacationHandler(req: Request, res: Response): Promise<void> {
  // Same reasoning as tripController.ts's getTripHandler: a malformed uuid can never
  // match a real vacation, so treat it as "not found" rather than letting it reach
  // Postgres as a type error the catch block can't distinguish from a real failure.
  if (!UUID_PATTERN.test(req.params.id)) {
    res.status(404).json({ error: 'Vacation not found' });
    return;
  }

  try {
    const vacation = await getVacationById(req.params.id, req.userId);
    if (!vacation) {
      res.status(404).json({ error: 'Vacation not found' });
      return;
    }
    res.json(vacation);
  } catch (error) {
    console.error('Failed to load vacation', error);
    res.status(500).json({ error: 'Failed to load vacation' });
  }
}

export async function addTripToVacationHandler(req: Request, res: Response): Promise<void> {
  if (!UUID_PATTERN.test(req.params.id)) {
    res.status(404).json({ error: 'Vacation not found' });
    return;
  }

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
    // assertStartDateNotInPast now runs inside addTripToVacation itself, after its
    // ownership check — so an unowned/nonexistent vacation always 404s regardless
    // of what else is wrong with the request, instead of a past-date request
    // leaking a 400 before ownership is ever checked.
    const trip = await addTripToVacation(req.params.id, city.trim(), startDate, endDate, preferences, req.userId);
    if (!trip) {
      res.status(404).json({ error: 'Vacation not found' });
      return;
    }
    res.json(trip);
  } catch (error) {
    if (error instanceof InvalidTripDateRangeError || error instanceof InvalidTripStartDateError) {
      res.status(400).json({ error: error.message });
      return;
    }
    if (error instanceof TripDateConflictError) {
      res.status(409).json({ error: error.message });
      return;
    }
    console.error('Failed to add trip to vacation', error);
    res.status(500).json({ error: 'Failed to add trip to vacation' });
  }
}
