// Shapes for the Google Places API (New) `places:searchText` response.
// Only the fields we request via X-Goog-FieldMask are modeled — see placesService.ts.

export interface GooglePlaceText {
  text: string;
  languageCode: string;
}

export interface GooglePlaceLocation {
  latitude: number;
  longitude: number;
}

export interface GooglePlace {
  id: string;
  displayName: GooglePlaceText;
  location: GooglePlaceLocation;
  rating?: number;
  // Stored as-is in the `openingHours` jsonb column — not parsed until v8.
  regularOpeningHours?: Record<string, unknown>;
  primaryTypeDisplayName?: GooglePlaceText;
}

export interface GooglePlacesSearchTextResponse {
  places?: GooglePlace[];
}
