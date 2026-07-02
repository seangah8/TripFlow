import { ILike } from 'typeorm';
import { AppDataSource } from '../../config/data-source';
import { Place } from '../../entities/Place';

// Case-insensitive match — an exact `=` comparison would silently return an
// empty list for e.g. 'paris' vs a seeded 'Paris', indistinguishable from
// there being no data at all.
export async function getPlacesByCity(city: string): Promise<Place[]> {
  return AppDataSource.getRepository(Place).find({ where: { city: ILike(city) } });
}
