import { Request, Response } from 'express';
import { getPlacesByCity } from '../services/placesService';

export async function getPlaces(req: Request, res: Response): Promise<void> {
  const { city } = req.query;
  if (typeof city !== 'string' || !city) {
    res.status(400).json({ error: 'city query parameter is required' });
    return;
  }

  try {
    const places = await getPlacesByCity(city);
    res.json(places);
  } catch (error) {
    console.error('Failed to fetch places', error);
    res.status(500).json({ error: 'Failed to fetch places' });
  }
}
