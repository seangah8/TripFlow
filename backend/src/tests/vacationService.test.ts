import { dateRangesOverlap } from '../api/services/vacationService';

describe('dateRangesOverlap', () => {
  it('detects an exact match', () => {
    expect(dateRangesOverlap('2026-09-10', '2026-09-11', '2026-09-10', '2026-09-11')).toBe(true);
  });

  it('detects partial overlap on one edge', () => {
    expect(dateRangesOverlap('2026-09-10', '2026-09-11', '2026-09-11', '2026-09-13')).toBe(true);
  });

  it('detects one range fully containing another', () => {
    expect(dateRangesOverlap('2026-09-01', '2026-09-30', '2026-09-10', '2026-09-11')).toBe(true);
  });

  // Sharing only a boundary date with no actual day overlap should not count as overlapping.
  it('returns false for adjacent, non-overlapping ranges', () => {
    expect(dateRangesOverlap('2026-09-10', '2026-09-11', '2026-09-12', '2026-09-13')).toBe(false);
  });

  it('returns false for clearly separate ranges', () => {
    expect(dateRangesOverlap('2026-09-01', '2026-09-02', '2026-10-01', '2026-10-02')).toBe(false);
  });
});
