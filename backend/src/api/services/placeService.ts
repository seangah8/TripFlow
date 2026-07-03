import { In, type QueryDeepPartialEntity } from 'typeorm';
import { AppDataSource } from '../../config/data-source';
import { Place } from '../../entities/Place';
import type { GooglePlace, GooglePlaceLocation, GooglePlacesSearchTextResponse } from '../../types/googlePlaces';

const SEARCH_TEXT_URL = 'https://places.googleapis.com/v1/places:searchText';

// Only requesting the fields we actually store — Google bills searchText by
// which fields are in this mask, so anything unused here (e.g. photos) costs nothing.
// `nextPageToken` must be listed explicitly too, like any other response field.
const FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.location',
  'places.rating',
  'places.regularOpeningHours',
  'places.primaryTypeDisplayName',
  'nextPageToken',
].join(',');

// Google requires a short delay after receiving a nextPageToken before it
// becomes valid for the next request — without it, the follow-up call 400s.
const PAGE_TOKEN_DELAY_MS = 2000;

async function fetchSearchTextPage(
  city: string,
  apiKey: string,
  pageToken?: string,
): Promise<GooglePlacesSearchTextResponse> {
  const response = await fetch(SEARCH_TEXT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': FIELD_MASK,
    },
    body: JSON.stringify({
      textQuery: `tourist attractions in ${city}`,
      maxResultCount: 20,
      ...(pageToken ? { pageToken } : {}),
    }),
  });

  if (!response.ok) {
    throw new Error(`Google Places request failed: ${response.status} ${await response.text()}`);
  }

  return (await response.json()) as GooglePlacesSearchTextResponse;
}

// Broad query, no interest filtering yet — that's v4's preferences wizard.
// Paginates via nextPageToken until `targetCount` places are collected or
// Google runs out of pages, so repeat generates for the same city (v2's day
// timeline needs more than ~20 places per trip) don't just return the same set.
export async function fetchAndUpsertPlaces(city: string, targetCount = 20): Promise<Place[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_PLACES_API_KEY is not set');
  }

  const collected: GooglePlace[] = [];
  let pageToken: string | undefined;

  do {
    if (pageToken) {
      await new Promise((resolve) => setTimeout(resolve, PAGE_TOKEN_DELAY_MS));
    }

    const { places: pagePlaces = [], nextPageToken } = await fetchSearchTextPage(city, apiKey, pageToken);
    collected.push(...pagePlaces);
    pageToken = nextPageToken;
  } while (pageToken && collected.length < targetCount);

  if (collected.length === 0) {
    return [];
  }

  const rows = collected
    // Filter before slicing — otherwise a result missing `location` inside the
    // first `targetCount` entries silently shrinks the final count instead of
    // being backfilled by a valid entry already sitting just past the cutoff.
    .filter(
      (googlePlace): googlePlace is GooglePlace & { location: GooglePlaceLocation } =>
        Boolean(googlePlace.location),
    )
    .slice(0, targetCount)
    .map((googlePlace) => ({
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
