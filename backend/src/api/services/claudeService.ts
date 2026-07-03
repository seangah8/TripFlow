import Anthropic from '@anthropic-ai/sdk';
import type { Place } from '../../entities/Place';
import type { TripPreferences } from '../../types/trip';
import type { ClaudePlaceSummary, CurationOutput } from '../../types/claudeCuration';

// Locked in BLUE_PRINT.md Section 5 — curation is a classification-style task over a list
// Google already returned, not open-ended reasoning, so Sonnet 5 is the right tier.
const CLAUDE_MODEL = 'claude-sonnet-5';

// Output is just an array of googlePlaceId strings — well under the streaming threshold.
const MAX_OUTPUT_TOKENS = 4096;

// Not caught specially by tripController.ts — falls into its existing generic
// catch-and-500 branch, per this session's decision that a curation failure fails
// the whole trip-generation request rather than silently falling back to the
// uncurated pool.
export class ClaudeCurationError extends Error {}

const CURATION_SCHEMA = {
  type: 'object',
  properties: {
    selectedPlaceIds: {
      type: 'array',
      items: { type: 'string' },
    },
  },
  required: ['selectedPlaceIds'],
  additionalProperties: false,
} as const;

// Trims each Place down to only what's relevant to a curation decision — no photoUrl,
// openingHours, or internal id, which would just cost tokens for no benefit here.
function toClaudePlaceSummary(place: Place): ClaudePlaceSummary {
  return {
    googlePlaceId: place.googlePlaceId,
    name: place.name,
    category: place.category,
    rating: place.rating,
    lat: place.lat,
    lng: place.lng,
  };
}

// Pure and exported for unit testing — same pattern as placeService.ts's buildSearchQueries.
export function buildUserPrompt(places: Place[], preferences: TripPreferences, totalDays: number): string {
  return [
    `Trip length: ${totalDays} day${totalDays === 1 ? '' : 's'}`,
    `Preferences: ${JSON.stringify(preferences)}`,
    '',
    'Candidate places (JSON array):',
    JSON.stringify(places.map(toClaudePlaceSummary)),
  ].join('\n');
}

const CURATION_SYSTEM_PROMPT = `You are curating a list of real, 
Google-verified places into the best subset for a multi-day vacation itinerary. 
You will be given the traveler's preferences, the number of days the trip covers, 
and the full list of candidate places (name, category, rating, coordinates).

Select the subset of places that are legitimate, worth visiting, 
and a good fit for the stated preferences and trip length. 
Exclude places that are low-quality, 
clearly off-theme, redundant duplicates of a better-rated nearby place, 
or not genuine attractions (e.g. gas stations, generic parking, chain drugstores) 
unless they match a stated interest such as "shopping".

Return every place you keep by its exact googlePlaceId from the input list — do 
not invent, alter, abbreviate, or guess an id. 
Only return ids that appear verbatim in the candidate list.`;

function createClaudeClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not set');
  }
  return new Anthropic({ apiKey });
}

// A refusal or truncation is a normal, non-throwing HTTP 200 from the SDK's perspective —
// stop_reason has to be checked before the content is trusted at all.
export function extractSelectedPlaceIds(message: Anthropic.Message): string[] {
  if (message.stop_reason === 'refusal') {
    throw new ClaudeCurationError('Claude refused the curation request');
  }
  if (message.stop_reason === 'max_tokens') {
    throw new ClaudeCurationError('Claude curation response was truncated at max_tokens');
  }

  const textBlock = message.content.find((block): block is Anthropic.TextBlock => block.type === 'text');
  if (!textBlock) {
    throw new ClaudeCurationError('Claude curation response contained no text block');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(textBlock.text);
  } catch (error) {
    throw new ClaudeCurationError(`Claude curation response was not valid JSON: ${(error as Error).message}`);
  }

  if (!parsed || typeof parsed !== 'object' || !Array.isArray((parsed as CurationOutput).selectedPlaceIds)) {
    throw new ClaudeCurationError('Claude curation response did not match the expected schema');
  }

  return (parsed as CurationOutput).selectedPlaceIds.filter((id): id is string => typeof id === 'string');
}

// Never trusts Claude's ids directly — filtering the *known* `places` array down to whichever
// ids survived means a fabricated or mistyped googlePlaceId simply matches nothing, and the
// result can never contain a Place that wasn't in the input. Also naturally dedupes (a
// googlePlaceId can match at most one Place) and preserves the input's original order.
export function filterToKnownPlaces(selectedIds: string[], places: Place[]): Place[] {
  const validIds = new Set(selectedIds);
  return places.filter((place) => validIds.has(place.googlePlaceId));
}

// `client` is injectable so unit tests can pass a fake `{ messages: { create: jest.fn() } }`
// instead of module-mocking the SDK.
export async function curatePlaces(
  places: Place[],
  preferences: TripPreferences,
  totalDays: number,
  client: Anthropic = createClaudeClient(),
): Promise<Place[]> {
  const response = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: MAX_OUTPUT_TOKENS,
    // Sonnet 5 runs adaptive thinking by default when `thinking` is omitted. This is a
    // bounded classification task sitting in the synchronous request path the user is
    // waiting on, so disabling it explicitly keeps latency/cost predictable.
    thinking: { type: 'disabled' },
    system: CURATION_SYSTEM_PROMPT,
    output_config: {
      format: {
        type: 'json_schema',
        schema: CURATION_SCHEMA,
      },
    },
    messages: [{ role: 'user', content: buildUserPrompt(places, preferences, totalDays) }],
  });

  const selectedIds = extractSelectedPlaceIds(response);
  return filterToKnownPlaces(selectedIds, places);
}
