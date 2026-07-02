import { In } from 'typeorm';
import type { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { AppDataSource } from '../../config/data-source';
import { Place } from '../../entities/Place';
import type { GooglePlacesSearchTextResponse } from '../../types/googlePlaces';

const SEARCH_TEXT_URL = 'https://places.googleapis.com/v1/places:searchText';

// Only requesting the fields we actually store — Google bills searchText by
// which fields are in this mask, so anything unused here (e.g. photos) costs nothing.
const FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.location',
  'places.rating',
  'places.regularOpeningHours',
  'places.primaryTypeDisplayName',
].join(',');

// Broad query, no interest filtering yet — that's v4's preferences wizard.
export async function fetchAndUpsertPlaces(city: string): Promise<Place[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_PLACES_API_KEY is not set');
  }

  const response = await fetch(SEARCH_TEXT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': FIELD_MASK,
    },
    body: JSON.stringify({
      // what we ask google search on the map.
      textQuery: `tourist attractions in ${city}`,
      maxResultCount: 20,
    }),
  });

  if (!response.ok) {
    throw new Error(`Google Places request failed: ${response.status} ${await response.text()}`);
  }

  const { places: googlePlaces = [] } = (await response.json()) as GooglePlacesSearchTextResponse;
  if (googlePlaces.length === 0) {
    return [];
  }

  const rows = googlePlaces.map((googlePlace) => ({
    googlePlaceId: googlePlace.id,
    name: googlePlace.displayName.text,
    lat: googlePlace.location.latitude,
    lng: googlePlace.location.longitude,
    city,
    rating: googlePlace.rating ?? null,
    openingHours: googlePlace.regularOpeningHours ?? null,
    category: googlePlace.primaryTypeDisplayName?.text ?? null,
  }));

  const placeRepository = AppDataSource.getRepository(Place);
  // TypeORM's QueryDeepPartialEntity recurses into object-typed columns; for a
  // jsonb column typed as Record<string, unknown>, that recursion can't line up
  // with the plain object literals above, so the cast is required here.
  await placeRepository.upsert(rows as QueryDeepPartialEntity<Place>[], ['googlePlaceId']);

  // Re-query the exact set just upserted rather than the whole city catalog —
  // scopes the response to what this fetch actually returned, not whatever
  // has accumulated for this city across prior generates.
  return placeRepository.find({
    where: { googlePlaceId: In(rows.map((row) => row.googlePlaceId)) },
  });
}
