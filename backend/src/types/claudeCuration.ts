// Shape of the structured-output response claudeService.ts asks Claude to return —
// just enough to select a subset of places by googlePlaceId. Per-stop reasoning/time
// estimates are v6 scope, already reserved as nullable columns on TripStop.
export interface CurationOutput {
  selectedPlaceIds: string[];
}

// Trimmed per-place summary sent to Claude for a curation decision — no photoUrl,
// openingHours, or internal id, which would cost tokens without helping the decision.
export interface ClaudePlaceSummary {
  googlePlaceId: string;
  name: string;
  category: string | null;
  rating: number | null;
  lat: number;
  lng: number;
}
