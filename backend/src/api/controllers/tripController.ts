import { Request, Response } from 'express';
import { generateTrip, InvalidTripDateRangeError } from '../services/tripService';
import type { TripGenerateRequest } from '../../types/trip';

export async function generateTripHandler(req: Request, res: Response): Promise<void> {
  const { city, startDate, endDate } = req.body as Partial<TripGenerateRequest>;

  if (typeof city !== 'string' || !city.trim()) {
    res.status(400).json({ error: 'city is required' });
    return;
  }
  if (typeof startDate !== 'string' || typeof endDate !== 'string') {
    res.status(400).json({ error: 'startDate and endDate are required' });
    return;
  }

  try {
    const trip = await generateTrip(city.trim(), startDate, endDate);
    res.json(trip);
  } catch (error) {
    if (error instanceof InvalidTripDateRangeError) {
      res.status(400).json({ error: error.message });
      return;
    }
    console.error('Failed to generate trip', error);
    res.status(500).json({ error: 'Failed to generate trip' });
  }
}
