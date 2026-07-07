import Anthropic from '@anthropic-ai/sdk';
import type { Place } from '../../entities/Place';
import type { TripPreferences } from '../../types/trip';
import type {
  ClaudeCuratedStop,
  ClaudePlaceSummary,
  CurationOutput,
  CurationResult,
  CuratedStop,
  ExtractedCuration,
} from '../../types/claudeCuration';

// Locked in BLUE_PRINT.md Section 5 — curation is a classification-style task over a list
// Google already returned, not open-ended reasoning, so Sonnet 5 is the right tier.
const CLAUDE_MODEL = 'claude-sonnet-5';

// Token usage constants control
const BASE_OUTPUT_TOKENS = 1024;
const TOKENS_PER_PLACE = 130;
const PLACES_PER_DAY_ESTIMATE = 5;
const MIN_PLACES_ESTIMATE = 20;
const MAX_OUTPUT_TOKENS_CAP = 32000;

// Pure and exported for unit testing — same pattern as placeService.ts's perQueryTarget.
export function computeMaxOutputTokens(totalDays: number): number {
  const estimatedPlaces = Math.max(totalDays * PLACES_PER_DAY_ESTIMATE, MIN_PLACES_ESTIMATE);
  return Math.min(BASE_OUTPUT_TOKENS + estimatedPlaces * TOKENS_PER_PLACE, MAX_OUTPUT_TOKENS_CAP);
}

// Bounds for estimatedMinutes/reasoning — enforced entirely in code (see extractSelectedPlaces
// below) since Anthropic's structured-output schema rejects minimum/maximum/maxLength outright.
const MIN_ESTIMATED_MINUTES = 15;
const MAX_ESTIMATED_MINUTES = 240;
const ESTIMATED_MINUTES_STEP = 15;
const MAX_REASONING_LENGTH = 300;

// Not caught specially by tripController.ts — falls into its generic catch-and-500
// branch, since a curation failure fails the whole request rather than falling back.
export class ClaudeCurationError extends Error {}

// No minimum/maximum/maxLength here — those bounds are described to Claude only
// via the system prompt and enforced in code (extractSelectedPlaces below).
const CURATION_SCHEMA = {
  type: 'object',
  properties: {
    selectedPlaces: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          googlePlaceId: { type: 'string' },
          estimatedMinutes: { type: 'integer' },
          reasoning: { type: 'string' },
        },
        required: ['googlePlaceId', 'estimatedMinutes', 'reasoning'],
        additionalProperties: false,
      },
    },
    // Sibling field, not a per-place flag — guarantees "at most one iconic place"
    // structurally instead of needing to be defended in code across many entries.
    iconicPlaceId: { type: 'string' },
  },
  required: ['selectedPlaces', 'iconicPlaceId'],
  additionalProperties: false,
} as const;

// Trims each Place down to only what's relevant to a curation decision — no photoName,
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

For every place you keep, return an object with: its exact googlePlaceId from
the input list (do not invent, alter, abbreviate, or guess an id — only return
ids that appear verbatim in the candidate list); an estimatedMinutes value (a
realistic whole number of minutes, between 15 and 240, in 15-minute
increments, for how long a typical visitor would spend there); and a
reasoning string (at most 300 characters) briefly explaining, for the
traveler reading it, why this place earned its spot on the trip given their
stated preferences.

Also return a top-level iconicPlaceId: the exact googlePlaceId, from among the
places you kept, of the single most iconic, photogenic, must-see stop for this
whole trip — the one place that would best represent it as a cover photo.`;

function createClaudeClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not set');
  }
  return new Anthropic({ apiKey });
}

// Clamps and snaps to the nearest 15-minute step, instead of rejecting the whole stop —
// losing a place entirely is worse than a slightly-adjusted estimate.
function normalizeEstimatedMinutes(rawMinutes: number): number {
  const clamped = Math.min(Math.max(rawMinutes, MIN_ESTIMATED_MINUTES), MAX_ESTIMATED_MINUTES);
  return Math.round(clamped / ESTIMATED_MINUTES_STEP) * ESTIMATED_MINUTES_STEP;
}

// A refusal or truncation is a normal, non-throwing HTTP 200 from the SDK's perspective —
// stop_reason has to be checked before the content is trusted at all.
export function extractSelectedPlaces(message: Anthropic.Message): ExtractedCuration {
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

  if (
    !parsed ||
    typeof parsed !== 'object' ||
    !Array.isArray((parsed as CurationOutput).selectedPlaces) ||
    typeof (parsed as CurationOutput).iconicPlaceId !== 'string'
  ) {
    throw new ClaudeCurationError('Claude curation response did not match the expected schema');
  }

  // Defensive validation/normalization — the request schema only asserts type/required,
  // so the actual bounds are enforced here based only on the prompt's instructions to Claude.
  const entries: unknown[] = (parsed as CurationOutput).selectedPlaces;
  const stops = entries
    .filter(
      (entry): entry is ClaudeCuratedStop =>
        !!entry &&
        typeof entry === 'object' &&
        typeof (entry as ClaudeCuratedStop).googlePlaceId === 'string' &&
        typeof (entry as ClaudeCuratedStop).estimatedMinutes === 'number' &&
        typeof (entry as ClaudeCuratedStop).reasoning === 'string',
    )
    .map((entry) => ({
      googlePlaceId: entry.googlePlaceId,
      estimatedMinutes: normalizeEstimatedMinutes(entry.estimatedMinutes),
      reasoning: entry.reasoning.slice(0, MAX_REASONING_LENGTH),
    }));

  return { stops, iconicPlaceId: (parsed as CurationOutput).iconicPlaceId };
}

// Never trusts Claude's ids directly — filtering the *known* `places` array down to whichever
// ids survived means a fabricated googlePlaceId simply matches nothing. Also naturally dedupes.
export function filterToKnownStops(selectedStops: ClaudeCuratedStop[], places: Place[]): CuratedStop[] {
  const selectionByPlaceId = new Map(selectedStops.map((stop) => [stop.googlePlaceId, stop]));
  return places
    .filter((place) => selectionByPlaceId.has(place.googlePlaceId))
    .map((place) => {
      const selection = selectionByPlaceId.get(place.googlePlaceId)!;
      return { place, estimatedMinutes: selection.estimatedMinutes, reasoning: selection.reasoning };
    });
}

// `client` is injectable so unit tests can pass a fake `{ messages: { create: jest.fn() } }`
// instead of module-mocking the SDK.
export async function curatePlaces(
  places: Place[],
  preferences: TripPreferences,
  totalDays: number,
  client: Anthropic = createClaudeClient(),
): Promise<CurationResult> {
  const response = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: computeMaxOutputTokens(totalDays),
    // Sonnet 5 runs adaptive thinking by default when omitted — disabled explicitly to
    // keep latency/cost predictable for this synchronous request.
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

  const { stops: selectedStops, iconicPlaceId } = extractSelectedPlaces(response);
  const stops = filterToKnownStops(selectedStops, places);

  // Same anti-hallucination principle as filterToKnownStops: only trust iconicPlaceId
  // if it names one of the places actually kept in the trip, not just any candidate.
  const iconicStop = stops.find((stop) => stop.place.googlePlaceId === iconicPlaceId);

  return { stops, coverPhotoName: iconicStop?.place.photoName ?? null };
}
