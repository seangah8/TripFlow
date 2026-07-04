import { In, type QueryDeepPartialEntity } from 'typeorm';
import { AppDataSource } from '../../config/data-source';
import { Place } from '../../entities/Place';
import type { GooglePlace, GooglePlaceLocation, GooglePlacesSearchTextResponse } from '../../types/googlePlaces';
import type { TripPreferences } from '../../types/trip';

type Interest = TripPreferences['interests'][number];

const SEARCH_TEXT_URL = 'https://places.googleapis.com/v1/places:searchText';

// One textQuery phrase per interest — Google Places (New) searchText takes free-text
// queries rather than a list of place types. Kept in sync with BLUE_PRINT.md's mapping table.
const INTEREST_QUERY_PHRASES: Record<Interest, string> = {
  museums: 'museums and art galleries in {city}',
  food: 'restaurants, cafes and bakeries in {city}',
  nature: 'parks and nature attractions in {city}',
  nightlife: 'bars and nightlife in {city}',
  shopping: 'shopping and markets in {city}',
};

// Always runs alongside whichever interests are selected — without it, picking only e.g.
// "food" would never surface a city's must-see landmarks. Also the sole query when no interests are selected.
const BASELINE_QUERY_PHRASE = 'tourist attractions in {city}';

// Pure and exported for unit testing — no network, no city-specific state beyond string
// interpolation. Baseline always first so it reads naturally in logs/tests.
export function buildSearchQueries(city: string, interests: Interest[]): string[] {
  const phrases = [BASELINE_QUERY_PHRASE, ...interests.map((interest) => INTEREST_QUERY_PHRASES[interest])];
  return phrases.map((phrase) => phrase.replace('{city}', city));
}

// Extracted purely so the even-split-across-queries math is unit-testable on its own.
export function perQueryTarget(targetCount: number, queryCount: number): number {
  return Math.ceil(targetCount / queryCount);
}

// Only requesting the fields we actually store — Google bills searchText by which
// fields are in this mask. `nextPageToken` must be listed explicitly too.
const FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.location',
  'places.rating',
  'places.regularOpeningHours',
  'places.primaryTypeDisplayName',
  'places.photos',
  'nextPageToken',
].join(',');

// Google requires a short delay after receiving a nextPageToken before it
// becomes valid for the next request — without it, the follow-up call 400s.
const PAGE_TOKEN_DELAY_MS = 2000;

async function fetchSearchTextPage(
  queryText: string,
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
      textQuery: queryText,
      maxResultCount: 20,
      ...(pageToken ? { pageToken } : {}),
    }),
  });

  if (!response.ok) {
    throw new Error(`Google Places request failed: ${response.status} ${await response.text()}`);
  }

  return (await response.json()) as GooglePlacesSearchTextResponse;
}

// Paginates a single query via nextPageToken until `targetCount` places are collected
// or Google runs out of pages — a trip needs more than one page's worth of places.
async function collectPlacesForQuery(queryText: string, apiKey: string, targetCount: number): Promise<GooglePlace[]> {
  const collected: GooglePlace[] = [];
  let pageToken: string | undefined;

  do {
    if (pageToken) {
      await new Promise((resolve) => setTimeout(resolve, PAGE_TOKEN_DELAY_MS));
    }

    const { places: pagePlaces = [], nextPageToken } = await fetchSearchTextPage(queryText, apiKey, pageToken);
    collected.push(...pagePlaces);
    pageToken = nextPageToken;
  } while (pageToken && collected.length < targetCount);

  return collected;
}

// Runs one query per selected interest plus the always-on baseline, splitting `targetCount`
// evenly across however many queries are active.
export async function fetchAndUpsertPlaces(city: string, targetCount = 20, interests: Interest[] = []): Promise<Place[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_PLACES_API_KEY is not set');
  }

  const queries = buildSearchQueries(city, interests);
  const targetPerQuery = perQueryTarget(targetCount, queries.length);

  // Queries are independent, so run them concurrently — Google's quota is a
  // queries-per-minute budget, not a concurrency limit. Pagination within each query still runs sequentially.
  const perQueryResults = await Promise.all(
    queries.map((queryText) => collectPlacesForQuery(queryText, apiKey, targetPerQuery)),
  );
  // collectPlacesForQuery stops once it has *at least* targetPerQuery, which can overshoot —
  // cap each query's contribution here so the baseline doesn't crowd out interest queries.
  const collected = perQueryResults.flatMap((queryResults) => queryResults.slice(0, targetPerQuery));

  if (collected.length === 0) {
    return [];
  }

  // Multiple queries can surface the same place — dedupe before upserting, since a
  // single multi-row upsert can't affect the same row twice in one statement.
  const deduped = [...new Map(collected.map((googlePlace) => [googlePlace.id, googlePlace])).values()];

  const rows = deduped
    // Filter before slicing — otherwise a missing `location` inside the first `targetCount`
    // entries silently shrinks the count instead of being backfilled from past the cutoff.
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
      // Just the first photo's resource name — the frontend builds the actual
      // image URL from this (see frontend/src/utils/placePhoto.ts).
      photoName: googlePlace.photos?.[0]?.name ?? null,
    }));

  const placeRepository = AppDataSource.getRepository(Place);
  // TypeORM's QueryDeepPartialEntity recurses into object-typed columns; for the jsonb
  // openingHours column, that recursion can't line up with the plain literals above.
  await placeRepository.upsert(rows as QueryDeepPartialEntity<Place>[], ['googlePlaceId']);

  // Re-query the exact set just upserted rather than the whole city catalog — scopes the
  // response to what this fetch returned, not prior generates for this city.
  return placeRepository.find({
    where: { googlePlaceId: In(rows.map((row) => row.googlePlaceId)) },
  });
}
