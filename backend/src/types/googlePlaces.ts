// Shapes for the Google Places API (New) `places:searchText` response.
// Only the fields we request via X-Goog-FieldMask are modeled — see placeService.ts.

export interface GooglePlaceText {
  text: string;
  languageCode: string;
}

export interface GooglePlaceLocation {
  latitude: number;
  longitude: number;
}

// Only `name` (the photo *resource name*) is stored — the frontend exchanges it for
// an actual image via Google's photo media endpoint using the public Maps key.
export interface GooglePlacePhoto {
  name: string;
}

export interface GooglePlace {
  id: string;
  displayName: GooglePlaceText;
  // Requesting this field doesn't guarantee Google populates it for every
  // result — placeService.ts filters out entries missing it before mapping.
  location?: GooglePlaceLocation;
  rating?: number;
  // Stored as-is in the `openingHours` jsonb column — not parsed yet (see FUTURE_SCOPE.md).
  regularOpeningHours?: Record<string, unknown>;
  primaryTypeDisplayName?: GooglePlaceText;
  photos?: GooglePlacePhoto[];
}

export interface GooglePlacesSearchTextResponse {
  places?: GooglePlace[];
  // Present when more results exist beyond this page — see placeService.ts's pagination loop.
  nextPageToken?: string;
}
