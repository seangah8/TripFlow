import type { Place } from '../entities/Place';

// Raw shape Claude returns per kept place — one entry per selectedPlaces item
// in the structured-output response.
export interface ClaudeCuratedStop {
  googlePlaceId: string;
  estimatedMinutes: number;
  reasoning: string;
}

// Shape of the structured-output response claudeService.ts asks Claude to return.
// iconicPlaceId is a sibling field, not a per-place flag — Claude names exactly one
// googlePlaceId (from among selectedPlaces) as the trip's cover photo.
export interface CurationOutput {
  selectedPlaces: ClaudeCuratedStop[];
  iconicPlaceId: string;
}

// Trimmed per-place summary sent to Claude for a curation decision — no photoName,
// openingHours, or internal id, which would cost tokens without helping the decision.
export interface ClaudePlaceSummary {
  googlePlaceId: string;
  name: string;
  category: string | null;
  rating: number | null;
  lat: number;
  lng: number;
}

// What claudeService.ts hands back to tripService.ts — a real Place paired with Claude's
// per-stop details. Keeps clustering.ts's Place[]-only contract untouched.
export interface CuratedStop {
  place: Place;
  estimatedMinutes: number;
  reasoning: string;
}

// Raw parse result from extractSelectedPlaces, before selectedPlaces/iconicPlaceId are
// matched against the known candidate list.
export interface ExtractedCuration {
  stops: ClaudeCuratedStop[];
  iconicPlaceId: string;
}

// What curatePlaces hands back to tripService.ts — the curated stops plus the resolved
// cover photo (null if iconicPlaceId didn't match one of the places actually kept).
export interface CurationResult {
  stops: CuratedStop[];
  coverPhotoName: string | null;
}
