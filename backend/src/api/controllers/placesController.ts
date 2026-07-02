import { Request, Response } from 'express';
import { fetchAndUpsertPlaces } from '../services/placesService';

export async function generatePlaces(req: Request, res: Response): Promise<void> {
  const { city } = req.body;
  if (typeof city !== 'string' || !city.trim()) {
    res.status(400).json({ error: 'city is required' });
    return;
  }

  try {
    const places = await fetchAndUpsertPlaces(city.trim());
    res.json(places);
  } catch (error) {
    console.error('Failed to generate places', error);
    res.status(500).json({ error: 'Failed to generate places' });
  }
}
