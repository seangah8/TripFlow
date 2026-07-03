import type Anthropic from '@anthropic-ai/sdk';
import {
  buildUserPrompt,
  curatePlaces,
  extractSelectedPlaceIds,
  filterToKnownPlaces,
  ClaudeCurationError,
} from '../api/services/claudeService';
import type { Place } from '../entities/Place';
import type { TripPreferences } from '../types/trip';

function makePlace(googlePlaceId: string, overrides: Partial<Place> = {}): Place {
  return {
    id: googlePlaceId,
    googlePlaceId,
    name: googlePlaceId,
    lat: 0,
    lng: 0,
    city: 'Test City',
    rating: null,
    photoUrl: 'https://example.com/photo.jpg',
    openingHours: { periods: [] },
    category: null,
    ...overrides,
  };
}

const PREFERENCES: TripPreferences = {
  vibe: 'moderate',
  interests: ['museums', 'food'],
  groupType: 'couple',
  budget: 'mid-range',
};

// Anthropic.TextBlock requires `citations` — always null in these fakes, since
// citations aren't relevant to (and are incompatible with) structured outputs.
function fakeTextBlock(text: string): Anthropic.TextBlock {
  return { type: 'text', text, citations: null };
}

function fakeMessage(overrides: Partial<Anthropic.Message> = {}): Anthropic.Message {
  return {
    stop_reason: 'end_turn',
    content: [fakeTextBlock(JSON.stringify({ selectedPlaceIds: [] }))],
    ...overrides,
  } as Anthropic.Message;
}

function fakeClient(create: jest.Mock): Anthropic {
  return { messages: { create } } as unknown as Anthropic;
}

describe('buildUserPrompt', () => {
  it('includes the trip length and serialized preferences', () => {
    const prompt = buildUserPrompt([], PREFERENCES, 5);
    expect(prompt).toContain('Trip length: 5 days');
    expect(prompt).toContain(JSON.stringify(PREFERENCES));
  });

  it('uses singular "day" for a 1-day trip', () => {
    const prompt = buildUserPrompt([], PREFERENCES, 1);
    expect(prompt).toContain('Trip length: 1 day');
  });

  it('includes only the fields relevant to a curation decision, per place', () => {
    const place = makePlace('place-1', { name: 'Louvre', category: 'Museum', rating: 4.7, lat: 48.86, lng: 2.34 });
    const prompt = buildUserPrompt([place], PREFERENCES, 3);

    expect(prompt).toContain('"googlePlaceId":"place-1"');
    expect(prompt).toContain('"name":"Louvre"');
    expect(prompt).toContain('"category":"Museum"');
    expect(prompt).toContain('"rating":4.7');
    // photoUrl/openingHours/id are not relevant to curation and should never reach the prompt.
    expect(prompt).not.toContain('photoUrl');
    expect(prompt).not.toContain('openingHours');
    expect(prompt).not.toContain('example.com/photo.jpg');
  });
});

describe('extractSelectedPlaceIds', () => {
  it('parses a well-formed structured-output response', () => {
    const message = fakeMessage({
      content: [fakeTextBlock(JSON.stringify({ selectedPlaceIds: ['a', 'b'] }))],
    });
    expect(extractSelectedPlaceIds(message)).toEqual(['a', 'b']);
  });

  it('throws ClaudeCurationError on a refusal', () => {
    const message = fakeMessage({ stop_reason: 'refusal' });
    expect(() => extractSelectedPlaceIds(message)).toThrow(ClaudeCurationError);
  });

  it('throws ClaudeCurationError when the response was truncated at max_tokens', () => {
    const message = fakeMessage({ stop_reason: 'max_tokens' });
    expect(() => extractSelectedPlaceIds(message)).toThrow(ClaudeCurationError);
  });

  it('throws ClaudeCurationError when there is no text content block', () => {
    const message = fakeMessage({ content: [{ type: 'thinking', thinking: '', signature: '' }] } as never);
    expect(() => extractSelectedPlaceIds(message)).toThrow(ClaudeCurationError);
  });

  it('throws ClaudeCurationError when the text block is not valid JSON', () => {
    const message = fakeMessage({ content: [fakeTextBlock('not json')] });
    expect(() => extractSelectedPlaceIds(message)).toThrow(ClaudeCurationError);
  });

  it('throws ClaudeCurationError when the parsed JSON does not match the schema', () => {
    const message = fakeMessage({ content: [fakeTextBlock(JSON.stringify({ wrongField: [] }))] });
    expect(() => extractSelectedPlaceIds(message)).toThrow(ClaudeCurationError);
  });
});

describe('filterToKnownPlaces', () => {
  it('keeps only places whose googlePlaceId was selected', () => {
    const places = [makePlace('a'), makePlace('b'), makePlace('c')];
    expect(filterToKnownPlaces(['a', 'c'], places).map((p) => p.googlePlaceId)).toEqual(['a', 'c']);
  });

  it('silently drops a selected id that does not exist in the input — the hallucination guard', () => {
    const places = [makePlace('a'), makePlace('b')];
    expect(filterToKnownPlaces(['a', 'made-up-id'], places).map((p) => p.googlePlaceId)).toEqual(['a']);
  });

  it('returns an empty array when nothing was selected', () => {
    const places = [makePlace('a'), makePlace('b')];
    expect(filterToKnownPlaces([], places)).toEqual([]);
  });

  it('preserves the input places order, not the selected-ids order', () => {
    const places = [makePlace('a'), makePlace('b'), makePlace('c')];
    expect(filterToKnownPlaces(['c', 'a'], places).map((p) => p.googlePlaceId)).toEqual(['a', 'c']);
  });

  it('does not duplicate a place even if its id is selected more than once', () => {
    const places = [makePlace('a'), makePlace('b')];
    expect(filterToKnownPlaces(['a', 'a'], places).map((p) => p.googlePlaceId)).toEqual(['a']);
  });
});

describe('curatePlaces', () => {
  it('calls the client with the expected model, output schema, and prompt content', async () => {
    const create = jest.fn().mockResolvedValue(fakeMessage());
    const places = [makePlace('a')];

    await curatePlaces(places, PREFERENCES, 4, fakeClient(create));

    expect(create).toHaveBeenCalledTimes(1);
    const requestArg = create.mock.calls[0][0];
    expect(requestArg.model).toBe('claude-sonnet-5');
    expect(requestArg.thinking).toEqual({ type: 'disabled' });
    expect(requestArg.output_config.format.type).toBe('json_schema');
    expect(requestArg.output_config.format.schema.required).toEqual(['selectedPlaceIds']);
    expect(requestArg.messages[0].content).toContain('Trip length: 4 days');
  });

  it('returns the curated subset of Place entities, dropping any hallucinated id', async () => {
    const places = [makePlace('a'), makePlace('b'), makePlace('c')];
    const create = jest.fn().mockResolvedValue(
      fakeMessage({
        content: [fakeTextBlock(JSON.stringify({ selectedPlaceIds: ['a', 'c', 'not-real'] }))],
      }),
    );

    const result = await curatePlaces(places, PREFERENCES, 4, fakeClient(create));

    expect(result.map((p) => p.googlePlaceId)).toEqual(['a', 'c']);
  });

  it('propagates ClaudeCurationError from a refused request', async () => {
    const create = jest.fn().mockResolvedValue(fakeMessage({ stop_reason: 'refusal' }));
    await expect(curatePlaces([makePlace('a')], PREFERENCES, 4, fakeClient(create))).rejects.toThrow(
      ClaudeCurationError,
    );
  });

  it('propagates a network/SDK-level error unchanged', async () => {
    const create = jest.fn().mockRejectedValue(new Error('network down'));
    await expect(curatePlaces([makePlace('a')], PREFERENCES, 4, fakeClient(create))).rejects.toThrow(
      'network down',
    );
  });
});
