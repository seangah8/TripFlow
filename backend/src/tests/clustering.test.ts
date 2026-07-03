import type { Place } from '../entities/Place';
import { clusterPlacesByDay } from '../utils/clustering';

function makePlace(id: string, lat: number, lng: number, rating: number | null = null): Place {
  return {
    id,
    googlePlaceId: id,
    name: id,
    lat,
    lng,
    city: 'Test City',
    rating,
    photoUrl: null,
    openingHours: null,
    category: null,
  };
}

function idsOf(places: Place[]): string[] {
  return places.map((p) => p.id);
}

describe('clusterPlacesByDay', () => {
  it('splits tight geographic bands evenly, each band landing in a single day', () => {
    const days = ['2026-07-01', '2026-07-02', '2026-07-03'];
    const bandA = [-50.1, -50.05, -50.0, -49.95, -49.9].map((lng, i) => makePlace(`a${i}`, 0, lng));
    const bandB = [-0.1, -0.05, 0.0, 0.05, 0.1].map((lng, i) => makePlace(`b${i}`, 0, lng));
    const bandC = [49.9, 49.95, 50.0, 50.05, 50.1].map((lng, i) => makePlace(`c${i}`, 0, lng));
    const places = [...bandA, ...bandB, ...bandC];

    const result = clusterPlacesByDay(places, days);

    expect([...result.keys()]).toEqual(days);
    const sizes = days.map((d) => result.get(d)!.length);
    expect(sizes).toEqual([5, 5, 5]);

    // Each band's members must all land in the same single day, not be split.
    for (const band of [idsOf(bandA), idsOf(bandB), idsOf(bandC)]) {
      const daysContainingBand = days.filter((d) => {
        const dayIds = new Set(idsOf(result.get(d)!));
        return band.some((id) => dayIds.has(id));
      });
      expect(daysContainingBand).toHaveLength(1);
      expect(new Set(idsOf(result.get(daysContainingBand[0]!)!))).toEqual(new Set(band));
    }
  });

  it('is deterministic: identical input (and a deep clone of it) always produces identical output', () => {
    const days = ['2026-07-01', '2026-07-02', '2026-07-03', '2026-07-04'];
    const places: Place[] = [
      makePlace('p1', 40.71, -74.0, 4.5),
      makePlace('p2', 40.72, -74.01, null),
      makePlace('p3', 40.7, -73.99, 3.8),
      makePlace('p4', 40.75, -73.95, 4.9),
      makePlace('p5', 40.76, -73.94, null),
      makePlace('p6', 40.65, -74.05, 4.1),
      makePlace('p7', 40.64, -74.06, 4.0),
      makePlace('p8', 40.8, -73.9, 4.7),
      makePlace('p9', 40.81, -73.89, 3.5),
      makePlace('p10', 40.6, -74.1, null),
      makePlace('p11', 40.72, -74.02, 4.2),
      makePlace('p12', 40.78, -73.92, 4.6),
      makePlace('p13', 40.62, -74.08, 3.9),
      makePlace('p14', 40.73, -73.97, 4.4),
      makePlace('p15', 40.66, -74.03, 4.3),
    ];
    const inputBefore = JSON.parse(JSON.stringify(places));
    const clone: Place[] = JSON.parse(JSON.stringify(places));

    const project = (m: Map<string, Place[]>) => days.map((d) => [d, idsOf(m.get(d)!)]);

    const result1 = clusterPlacesByDay(places, days);
    const result2 = clusterPlacesByDay(clone, days);

    expect(project(result1)).toEqual(project(result2));
    // The input array must be left unmutated by clustering.
    expect(JSON.parse(JSON.stringify(places))).toEqual(inputBefore);
  });

  it('rebalances an underpopulated day by pulling filler places from an overloaded neighbor, instead of leaving it empty', () => {
    const days = ['2026-07-01', '2026-07-02', '2026-07-03'];
    // Ratings are distinct and ordered so "lowest-rated member" is unambiguous
    // at every step of the balancing pass (a4/b4/b3 are each group's lowest).
    const groupA = [
      ['a0', -100.0, 10],
      ['a1', -100.05, 9],
      ['a2', -99.95, 8],
      ['a3', -100.1, 7],
      ['a4', -99.9, 6],
    ].map(([id, lng, rating]) => makePlace(id as string, 0, lng as number, rating as number));
    const groupB = [
      ['b0', 99.9, 20],
      ['b1', 99.95, 19],
      ['b2', 100.0, 18],
      ['b3', 100.05, 17],
      ['b4', 100.1, 16],
    ].map(([id, lng, rating]) => makePlace(id as string, 0, lng as number, rating as number));
    // Positioned much closer (in longitude) to group A's centroid (~-100) than group B's (~100),
    // so it seeds its own (very underpopulated) cluster between the two.
    const outlier = makePlace('outlier', 0, -2, 50);
    const places = [...groupA, ...groupB, outlier];

    const result = clusterPlacesByDay(places, days);

    // Nothing dropped — 11 places over 3 days (well under the 15/day cap) are
    // fully redistributed, not discarded.
    const sizes = days.map((d) => result.get(d)!.length);
    expect(sizes.reduce((a, b) => a + b, 0)).toBe(places.length);

    // 11 / 3 = target sizes [4, 4, 3] (as even as possible), and the outlier's
    // own (otherwise 1-member) cluster is filled with whichever nearby places
    // (from its two geographic neighbors) sit closest to it, not just
    // whichever happened to be lowest-rated somewhere else in the city.
    expect(new Set(idsOf(result.get(days[0]!)!))).toEqual(new Set(['a0', 'a1', 'a2', 'a3']));
    expect(new Set(idsOf(result.get(days[1]!)!))).toEqual(new Set(['outlier', 'a4', 'b0', 'b1']));
    expect(new Set(idsOf(result.get(days[2]!)!))).toEqual(new Set(['b2', 'b3', 'b4']));
  });

  it('caps an oversized cluster at 15, keeping the highest-rated and treating null rating as 0', () => {
    const days = ['2026-07-01'];
    const rated = Array.from({ length: 17 }, (_, i) => makePlace(`r${i + 1}`, 0, 0, i + 1)); // ratings 1..17
    const nullRated = [makePlace('n1', 0, 0, null), makePlace('n2', 0, 0, null), makePlace('n3', 0, 0, null)];
    const places = [...rated, ...nullRated];

    const result = clusterPlacesByDay(places, days);
    const survivors = result.get(days[0]!)!;

    expect(survivors).toHaveLength(15);
    const survivorIds = new Set(idsOf(survivors));
    const expectedSurvivors = new Set(Array.from({ length: 15 }, (_, i) => `r${i + 3}`)); // ratings 3..17
    expect(survivorIds).toEqual(expectedSurvivors);
  });

  it('conserves every place and redistributes to keep day sizes as even as possible', () => {
    const days = ['2026-07-01', '2026-07-02', '2026-07-03', '2026-07-04'];
    const oversized = Array.from({ length: 18 }, (_, i) => makePlace(`g${i}`, 0, -100 - i * 0.01, i + 1));
    const s1 = [-0.06, -0.02, 0.02, 0.06].map((lng, i) => makePlace(`s1_${i}`, 0, lng));
    const s2 = [49.95, 49.98, 50.02, 50.05].map((lng, i) => makePlace(`s2_${i}`, 0, lng));
    const s3 = [99.95, 99.98, 100.02, 100.05].map((lng, i) => makePlace(`s3_${i}`, 0, lng));
    const places = [...oversized, ...s1, ...s2, ...s3];

    const result = clusterPlacesByDay(places, days);
    const sizes = days.map((d) => result.get(d)!.length);
    const allOutIds = days.flatMap((d) => idsOf(result.get(d)!));

    // Nothing dropped — 30 places over 4 days (well under the 15/day cap) are
    // fully redistributed, not discarded. No duplicates, nothing invented.
    expect(allOutIds).toHaveLength(places.length);
    expect(new Set(allOutIds).size).toBe(allOutIds.length);
    for (const id of allOutIds) {
      expect(idsOf(places)).toContain(id);
    }

    // 30 / 4 days = as-even-as-possible sizes of exactly two 8s and two 7s —
    // instead of one day with 18+ and others with as few as 4.
    expect(sizes.slice().sort((a, b) => a - b)).toEqual([7, 7, 8, 8]);
  });

  it('reaches a local optimum: no swap between any two days would reduce their combined spread from center', () => {
    const days = ['2026-07-01', '2026-07-02', '2026-07-03'];
    // Three loose regions with a deliberately uneven raw size (5/4/3, forcing
    // balanceClusters to pull places across regions to reach even targets),
    // which is exactly the scenario that can leave a correctable bad
    // placement on the table for improveCompactness to clean up.
    const places = [
      ...[0, 0.5, 1, 1.5, 2].map((lng, i) => makePlace(`x${i}`, 0, lng)),
      ...[20, 20.5, 21, 21.5].map((lng, i) => makePlace(`y${i}`, 0, lng)),
      ...[40, 40.3, 40.6].map((lng, i) => makePlace(`z${i}`, 0, lng)),
    ];

    const result = clusterPlacesByDay(places, days);
    const clusters = days.map((d) => result.get(d)!);

    // No two places (one from each of any two days) should be swappable for
    // a lower combined squared distance to their respective day's center —
    // i.e. the result can't be trivially improved by moving a place to the
    // day it actually belongs closer to.
    for (let i = 0; i < clusters.length; i++) {
      for (let j = i + 1; j < clusters.length; j++) {
        const ci = clusters[i]!;
        const cj = clusters[j]!;
        const centroidI = { lat: 0, lng: ci.reduce((s, p) => s + p.lng, 0) / ci.length };
        const centroidJ = { lat: 0, lng: cj.reduce((s, p) => s + p.lng, 0) / cj.length };
        for (const p of ci) {
          for (const q of cj) {
            const before = (p.lng - centroidI.lng) ** 2 + (q.lng - centroidJ.lng) ** 2;
            const after = (q.lng - centroidI.lng) ** 2 + (p.lng - centroidJ.lng) ** 2;
            expect(after).toBeGreaterThanOrEqual(before);
          }
        }
      }
    }
  });

  it('handles fewer places than days: spreads them one-per-day as far as possible, nothing lost', () => {
    const days = ['2026-07-01', '2026-07-02', '2026-07-03', '2026-07-04', '2026-07-05'];
    const places = [makePlace('p1', 40.7, -74.0), makePlace('p2', 41.9, -87.6)];

    const result = clusterPlacesByDay(places, days);
    const sizes = days.map((d) => result.get(d)!.length);
    const allOutIds = days.flatMap((d) => idsOf(result.get(d)!));

    expect([...result.keys()]).toEqual(days);
    expect(new Set(allOutIds)).toEqual(new Set(['p1', 'p2']));
    expect(allOutIds).toHaveLength(2);
    // 2 places over 5 days: at most 1 per day, never both stacked on one day.
    expect(sizes.every((s) => s <= 1)).toBe(true);
  });

  it('handles an empty places array: every day maps to an empty array, no crash', () => {
    const days = ['2026-07-01', '2026-07-02'];

    const result = clusterPlacesByDay([], days);

    expect([...result.keys()]).toEqual(days);
    expect(result.get(days[0]!)).toEqual([]);
    expect(result.get(days[1]!)).toEqual([]);
  });
});
