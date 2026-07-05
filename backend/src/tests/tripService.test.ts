import { computeFetchPoolSize } from '../api/services/tripService';

describe('computeFetchPoolSize', () => {
  describe('attempt 0 (normal path)', () => {
    // Short trips still fetch a 60-place floor, so Claude has enough candidates to curate from.
    it('applies the 60-place minimum for short trips', () => {
      expect(computeFetchPoolSize(1, 0)).toBe(60);
      expect(computeFetchPoolSize(6, 0)).toBe(60);
    });

    // Past the 60-place floor, the pool grows linearly with trip length.
    it('scales at 10 places per day once that exceeds the minimum', () => {
      expect(computeFetchPoolSize(7, 0)).toBe(70);
      expect(computeFetchPoolSize(9, 0)).toBe(90);
    });

    // FETCH_POOL_MAX bounds the normal (non-retry) path regardless of trip length.
    it('caps at 100 places for long trips', () => {
      expect(computeFetchPoolSize(14, 0)).toBe(100);
    });
  });

  describe('retries (attempt > 0)', () => {
    // Each retry escalates the pool size by a fixed increment on top of the base.
    it('adds 40 per retry on top of the short-trip minimum', () => {
      expect(computeFetchPoolSize(1, 1)).toBe(100);
      expect(computeFetchPoolSize(1, 2)).toBe(140);
    });

    // Retries can push the pool past FETCH_POOL_MAX — the cap only applies to attempt 0.
    it('adds 40 per retry on top of the long-trip cap, escalating past the normal ceiling', () => {
      expect(computeFetchPoolSize(14, 1)).toBe(140);
      expect(computeFetchPoolSize(14, 2)).toBe(180);
    });
  });
});
