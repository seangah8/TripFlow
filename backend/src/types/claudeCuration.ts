import type { Place } from '../entities/Place';

// Raw shape Claude returns per kept place — one entry per selectedPlaces item
// in the structured-output response.
export interface ClaudeCuratedStop {
  googlePlaceId: string;
  estimatedMinutes: number;
  reasoning: string;
}

// Shape of the structured-output response claudeService.ts asks Claude to return.
export interface CurationOutput {
  selectedPlaces: ClaudeCuratedStop[];
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

// What claudeService.ts hands back to tripService.ts — a real Place paired with
// Claude's per-stop details. Keeps clustering.ts's Place[]-only contract untouched;
// tripService.ts re-attaches these details after clustering runs.
export interface CuratedStop {
  place: Place;
  estimatedMinutes: number;
  reasoning: string;
}
