import { buildSearchQueries, perQueryTarget } from '../api/services/placeService';

describe('buildSearchQueries', () => {
  // With no interests selected, the always-on baseline is the only query run.
  it('returns just the baseline query when no interests are selected', () => {
    expect(buildSearchQueries('Paris', [])).toEqual(['tourist attractions in Paris']);
  });

  // Baseline must always lead so it reads naturally in logs/tests, followed by each interest's phrase.
  it('puts the baseline query first, followed by one phrase per selected interest', () => {
    const queries = buildSearchQueries('Paris', ['food', 'museums']);
    expect(queries).toEqual([
      'tourist attractions in Paris',
      'restaurants, cafes and bakeries in Paris',
      'museums and art galleries in Paris',
    ]);
  });

  it('preserves the given interest order after the baseline', () => {
    const queries = buildSearchQueries('Tokyo', ['nightlife', 'nature']);
    expect(queries).toEqual([
      'tourist attractions in Tokyo',
      'bars and nightlife in Tokyo',
      'parks and nature attractions in Tokyo',
    ]);
  });

  it('produces one query per interest plus baseline when all interests are selected', () => {
    const queries = buildSearchQueries('Rome', ['museums', 'food', 'nature', 'nightlife', 'shopping']);
    expect(queries).toHaveLength(6);
  });

  it('interpolates multi-word city names into every query', () => {
    const queries = buildSearchQueries('New York', ['shopping']);
    expect(queries).toEqual(['tourist attractions in New York', 'shopping and markets in New York']);
  });
});

describe('perQueryTarget', () => {
  it('gives the full target to a single query', () => {
    expect(perQueryTarget(20, 1)).toBe(20);
  });

  // Rounds up (ceil), not down, since under-covering the combined target is worse than a slight overshoot.
  it('rounds up so the combined target is never under-covered', () => {
    expect(perQueryTarget(20, 3)).toBe(7);
  });

  it('splits evenly when it divides cleanly', () => {
    expect(perQueryTarget(30, 6)).toBe(5);
  });
});
