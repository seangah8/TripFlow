import type { Place } from '../entities/Place';

interface Centroid {
  lat: number;
  lng: number;
}

const MAX_ITERATIONS = 10;
const MAX_CLUSTER_SIZE = 15;
const MAX_SWAP_PASSES = 20;

function squaredDistance(a: Centroid, b: Centroid): number {
  const dLat = a.lat - b.lat;
  const dLng = a.lng - b.lng;
  return dLat * dLat + dLng * dLng;
}

// Deterministic seed: no RNG. Centroids start at the midpoint of N equal
// slices of the longitude range, all at the mean latitude.
function seedCentroids(places: Place[], n: number): Centroid[] {
  let minLng = places[0]!.lng;
  let maxLng = places[0]!.lng;
  let latSum = 0;
  for (const place of places) {
    if (place.lng < minLng) minLng = place.lng;
    if (place.lng > maxLng) maxLng = place.lng;
    latSum += place.lat;
  }
  const meanLat = latSum / places.length;
  const width = (maxLng - minLng) / n;

  const centroids: Centroid[] = [];
  for (let i = 0; i < n; i++) {
    centroids.push({ lat: meanLat, lng: minLng + width * (i + 0.5) });
  }
  return centroids;
}

// Ties broken by lowest centroid index (strict `<` only) — the single
// tie-break rule reused everywhere in this module for determinism.
function assignPlaces(places: Place[], centroids: Centroid[]): number[] {
  return places.map((place) => {
    let bestIndex = 0;
    let bestDist = squaredDistance(place, centroids[0]!);
    for (let i = 1; i < centroids.length; i++) {
      const dist = squaredDistance(place, centroids[i]!);
      if (dist < bestDist) {
        bestDist = dist;
        bestIndex = i;
      }
    }
    return bestIndex;
  });
}

// An empty cluster keeps its previous centroid rather than going to NaN,
// so a centroid always has a well-defined position throughout iteration.
function recomputeCentroids(
  places: Place[],
  assignments: number[],
  previousCentroids: Centroid[],
  n: number,
): Centroid[] {
  const latSums = new Array<number>(n).fill(0);
  const lngSums = new Array<number>(n).fill(0);
  const counts = new Array<number>(n).fill(0);

  places.forEach((place, i) => {
    const cluster = assignments[i]!;
    latSums[cluster] += place.lat;
    lngSums[cluster] += place.lng;
    counts[cluster]++;
  });

  return previousCentroids.map((prev, i) =>
    counts[i]! === 0 ? prev : { lat: latSums[i]! / counts[i]!, lng: lngSums[i]! / counts[i]! },
  );
}

function buildClusters(places: Place[], assignments: number[], n: number): Place[][] {
  const clusters: Place[][] = Array.from({ length: n }, () => []);
  places.forEach((place, i) => {
    clusters[assignments[i]!]!.push(place);
  });
  return clusters;
}

// Divmod gives sizes that differ by at most 1 (the first `total % n` days get
// one extra), capped at MAX_CLUSTER_SIZE.
function computeTargetSizes(total: number, n: number): number[] {
  const base = Math.floor(total / n);
  const remainder = total % n;
  return Array.from({ length: n }, (_, i) => Math.min(i < remainder ? base + 1 : base, MAX_CLUSTER_SIZE));
}

// Moves places from over-target clusters to under-target ones, each move picking
// whichever candidate sits nearest to the neediest recipient's centroid (rating only breaks distance ties).
function balanceClusters(clusters: Place[][], centroids: Centroid[], n: number): Place[][] {
  const total = clusters.reduce((sum, cluster) => sum + cluster.length, 0);
  const targets = computeTargetSizes(total, n);
  const working = clusters.map((cluster) => [...cluster]);

  while (true) {
    let recipient = -1;
    let recipientNeed = 0;
    for (let i = 0; i < n; i++) {
      const need = targets[i]! - working[i]!.length;
      if (need > recipientNeed) {
        recipientNeed = need;
        recipient = i;
      }
    }
    if (recipient === -1) break;

    let donorCluster = -1;
    let donorPlaceIndex = -1;
    let bestDist = Infinity;
    let bestRating = Infinity;
    for (let i = 0; i < n; i++) {
      if (working[i]!.length <= targets[i]!) continue; // no surplus to give
      working[i]!.forEach((place, placeIndex) => {
        const dist = squaredDistance(place, centroids[recipient]!);
        const rating = place.rating ?? 0;
        if (dist < bestDist || (dist === bestDist && rating < bestRating)) {
          bestDist = dist;
          bestRating = rating;
          donorCluster = i;
          donorPlaceIndex = placeIndex;
        }
      });
    }

    if (donorCluster === -1) break; // no surplus left anywhere (shouldn't happen — totals always match)

    const [moved] = working[donorCluster]!.splice(donorPlaceIndex, 1);
    working[recipient]!.push(moved!);
  }

  // Only reachable when total exceeds n * MAX_CLUSTER_SIZE — drop the
  // excess, highest-rated survive.
  return working.map((cluster) =>
    cluster.length <= MAX_CLUSTER_SIZE
      ? cluster
      : [...cluster].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)).slice(0, MAX_CLUSTER_SIZE),
  );
}

function clusterCentroid(cluster: Place[]): Centroid {
  let latSum = 0;
  let lngSum = 0;
  for (const place of cluster) {
    latSum += place.lat;
    lngSum += place.lng;
  }
  return { lat: latSum / cluster.length, lng: lngSum / cluster.length };
}

// Runs after sizes are balanced: swaps two places (one per day) whenever it reduces combined
// squared distance to each day's center — corrects picks balanceClusters got right-sized but not closest.
function improveCompactness(clusters: Place[][], n: number): Place[][] {
  const working = clusters.map((cluster) => [...cluster]);

  for (let pass = 0; pass < MAX_SWAP_PASSES; pass++) {
    const centroids = working.map((cluster) => (cluster.length > 0 ? clusterCentroid(cluster) : { lat: 0, lng: 0 }));
    let improved = false;

    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        for (let pi = 0; pi < working[i]!.length; pi++) {
          for (let pj = 0; pj < working[j]!.length; pj++) {
            const p = working[i]![pi]!;
            const q = working[j]![pj]!;
            const before = squaredDistance(p, centroids[i]!) + squaredDistance(q, centroids[j]!);
            const after = squaredDistance(q, centroids[i]!) + squaredDistance(p, centroids[j]!);
            if (after < before) {
              working[i]![pi] = q;
              working[j]![pj] = p;
              improved = true;
            }
          }
        }
      }
    }

    if (!improved) break;
  }

  return working;
}

// K-means clustering of places into `days.length` geographic groups. Pure function,
// fully deterministic — same input always produces the same output.
export function clusterPlacesByDay(places: Place[], days: string[]): Map<string, Place[]> {
  const n = days.length;
  if (n === 0 || places.length === 0) {
    return new Map(days.map((date) => [date, []]));
  }

  let centroids = seedCentroids(places, n);
  let assignments = assignPlaces(places, centroids);
  let prevAssignments: number[] | null = null;

  for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
    if (prevAssignments !== null && assignments.every((a, i) => a === prevAssignments![i])) {
      break;
    }
    prevAssignments = assignments;
    centroids = recomputeCentroids(places, assignments, centroids, n);
    assignments = assignPlaces(places, centroids);
  }
  // Final sync: centroids still reflect the assignment from one step before the
  // loop's last reassignment — recompute once more for the true final center.
  centroids = recomputeCentroids(places, assignments, centroids, n);

  const clusters = improveCompactness(balanceClusters(buildClusters(places, assignments, n), centroids, n), n);

  const result = new Map<string, Place[]>();
  days.forEach((date, i) => result.set(date, clusters[i]!));
  return result;
}
