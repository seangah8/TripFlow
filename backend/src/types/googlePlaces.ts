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

// Only `name` (the photo *resource name*, e.g. "places/ABC/photos/XYZ") is stored —
// it's exchanged for an actual image by the frontend via Google's photo media
// endpoint, using the public Maps key. widthPx/heightPx/authorAttributions aren't
// requested since nothing here uses them.
export interface GooglePlacePhoto {
  name: string;
}

export interface GooglePlace {
  id: string;
  displayName: GooglePlaceText;
  // Requesting this field doesn't guarantee Google populates it for every
  // result — placesService.ts filters out entries missing it before mapping.
  location?: GooglePlaceLocation;
  rating?: number;
  // Stored as-is in the `openingHours` jsonb column — not parsed until v8.
  regularOpeningHours?: Record<string, unknown>;
  primaryTypeDisplayName?: GooglePlaceText;
  photos?: GooglePlacePhoto[];
}

export interface GooglePlacesSearchTextResponse {
  places?: GooglePlace[];
  // Present when more results exist beyond this page — see placesService.ts
  // pagination loop. Must be requested via the field mask like any other field.
  nextPageToken?: string;
}
