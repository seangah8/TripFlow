import { AppDataSource } from '../../config/data-source';
import { Place } from '../../entities/Place';

export async function getPlacesByCity(city: string): Promise<Place[]> {
  return AppDataSource.getRepository(Place).find({ where: { city } });
}
