import type { Place } from '../entities/Place';
import { clusterPlacesByDay } from './clustering';

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

  it('merges an under-3 cluster into its nearest neighboring cluster', () => {
    const days = ['2026-07-01', '2026-07-02', '2026-07-03'];
    const groupA = [-100.0, -100.05, -99.95, -100.1, -99.9].map((lng, i) => makePlace(`a${i}`, 0, lng));
    const groupB = [99.9, 99.95, 100.0, 100.05, 100.1].map((lng, i) => makePlace(`b${i}`, 0, lng));
    // Positioned much closer (in longitude) to group A's centroid (~-100) than group B's (~100).
    const outlier = makePlace('outlier', 0, -2);
    const places = [...groupA, ...groupB, outlier];

    const result = clusterPlacesByDay(places, days);
    const sizesByDay = days.map((d) => result.get(d)!.length);

    expect([...result.keys()]).toEqual(days);
    expect(sizesByDay.filter((s) => s === 0)).toHaveLength(1);
    expect(sizesByDay.sort((x, y) => x - y)).toEqual([0, 5, 6]);

    const dayWithSix = days.find((d) => result.get(d)!.length === 6)!;
    const dayWithFive = days.find((d) => result.get(d)!.length === 5)!;
    expect(new Set(idsOf(result.get(dayWithSix)!))).toEqual(new Set([...idsOf(groupA), 'outlier']));
    expect(new Set(idsOf(result.get(dayWithFive)!))).toEqual(new Set(idsOf(groupB)));

    // Nothing dropped in this scenario (max cluster size 6, well under the cap).
    const totalOut = sizesByDay.reduce((a, b) => a + b, 0);
    expect(totalOut).toBe(places.length);
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

  it('conserves every place exactly once, except for places dropped only via the 15-cap', () => {
    const days = ['2026-07-01', '2026-07-02', '2026-07-03', '2026-07-04'];
    const oversized = Array.from({ length: 18 }, (_, i) => makePlace(`g${i}`, 0, -100 - i * 0.01, i + 1));
    const s1 = [-0.06, -0.02, 0.02, 0.06].map((lng, i) => makePlace(`s1_${i}`, 0, lng));
    const s2 = [49.95, 49.98, 50.02, 50.05].map((lng, i) => makePlace(`s2_${i}`, 0, lng));
    const s3 = [99.95, 99.98, 100.02, 100.05].map((lng, i) => makePlace(`s3_${i}`, 0, lng));
    const places = [...oversized, ...s1, ...s2, ...s3];

    const result = clusterPlacesByDay(places, days);
    const allOutIds = days.flatMap((d) => idsOf(result.get(d)!));

    // No duplicates, nothing invented.
    expect(new Set(allOutIds).size).toBe(allOutIds.length);
    for (const id of allOutIds) {
      expect(idsOf(places)).toContain(id);
    }

    // s1/s2/s3 (12 places, none ever in a cluster over 15) all survive fully.
    for (const group of [s1, s2, s3]) {
      for (const p of group) {
        expect(allOutIds).toContain(p.id);
      }
    }

    // Exactly 15 of the oversized group's 18 places survive — the rest dropped by the cap.
    const survivingOversized = allOutIds.filter((id) => id.startsWith('g'));
    expect(survivingOversized).toHaveLength(15);
    expect(allOutIds).toHaveLength(places.length - 3);
  });

  it('handles fewer places than days: some day slots legitimately end up empty, nothing lost', () => {
    const days = ['2026-07-01', '2026-07-02', '2026-07-03', '2026-07-04', '2026-07-05'];
    const places = [makePlace('p1', 40.7, -74.0), makePlace('p2', 41.9, -87.6)];

    const result = clusterPlacesByDay(places, days);

    expect([...result.keys()]).toEqual(days);
    const allOutIds = days.flatMap((d) => idsOf(result.get(d)!));
    expect(new Set(allOutIds)).toEqual(new Set(['p1', 'p2']));
    expect(allOutIds).toHaveLength(2);
  });

  it('handles an empty places array: every day maps to an empty array, no crash', () => {
    const days = ['2026-07-01', '2026-07-02'];

    const result = clusterPlacesByDay([], days);

    expect([...result.keys()]).toEqual(days);
    expect(result.get(days[0]!)).toEqual([]);
    expect(result.get(days[1]!)).toEqual([]);
  });
});
