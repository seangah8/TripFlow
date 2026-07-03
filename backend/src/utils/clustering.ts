import type { Place } from '../entities/Place';

interface Centroid {
  lat: number;
  lng: number;
}

const MAX_ITERATIONS = 10;
const MIN_CLUSTER_SIZE = 3;
const MAX_CLUSTER_SIZE = 15;

function squaredDistance(a: Centroid, b: Centroid): number {
  const dLat = a.lat - b.lat;
  const dLng = a.lng - b.lng;
  return dLat * dLat + dLng * dLng;
}

// Deterministic seed: no RNG anywhere in this module. Centroids start at the
// midpoint of N equal slices of the overall longitude range, all at the mean
// latitude — same input always produces the same starting point.
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

// An empty cluster keeps its previous centroid rather than going to NaN —
// guarantees every centroid always has a well-defined position, including
// once mergeSmallClusters needs to measure distance to/from it.
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

// Single forward pass, not re-iterated: any cluster under MIN_CLUSTER_SIZE
// (including empty ones) merges into its nearest still-live neighbor by
// centroid distance. A cluster that receives a merge earlier in this same
// sweep can still merge onward later in the sweep if it's still small —
// that's a side effect of the fixed left-to-right order, not iteration.
function mergeSmallClusters(clusters: Place[][], centroids: Centroid[]): Place[][] {
  const n = clusters.length;
  const live = clusters.map((cluster) => [...cluster]);
  const dissolved = new Array<boolean>(n).fill(false);

  for (let i = 0; i < n; i++) {
    if (dissolved[i]) continue;
    if (live[i]!.length >= MIN_CLUSTER_SIZE) continue;

    let nearest = -1;
    let bestDist = Infinity;
    for (let j = 0; j < n; j++) {
      if (j === i || dissolved[j]) continue;
      const dist = squaredDistance(centroids[i]!, centroids[j]!);
      if (dist < bestDist) {
        bestDist = dist;
        nearest = j;
      }
    }

    if (nearest === -1) continue; // nothing left to merge into — leave as-is

    live[nearest]!.push(...live[i]!);
    live[i] = [];
    dissolved[i] = true;
  }

  return live;
}

// Runs after merging, so a merge that pushes a cluster over the cap is still
// caught. Ties in rating are broken implicitly by Array.sort's guaranteed
// stability, i.e. by each cluster's existing (deterministic) member order.
function capClusters(clusters: Place[][]): Place[][] {
  return clusters.map((cluster) => {
    if (cluster.length <= MAX_CLUSTER_SIZE) return cluster;
    return [...cluster].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)).slice(0, MAX_CLUSTER_SIZE);
  });
}

// K-means clustering of places into `days.length` geographic groups, one per
// day. Pure function, no DB/network dependency, fully deterministic — same
// input always produces the same output (BLUE_PRINT.md's locked rule).
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
  // Final sync: centroids still reflect the assignment from one step before
  // the loop's last reassignment — recompute once more before merging uses
  // centroid-to-centroid distances.
  centroids = recomputeCentroids(places, assignments, centroids, n);

  const clusters = capClusters(mergeSmallClusters(buildClusters(places, assignments, n), centroids));

  const result = new Map<string, Place[]>();
  days.forEach((date, i) => result.set(date, clusters[i]!));
  return result;
}
