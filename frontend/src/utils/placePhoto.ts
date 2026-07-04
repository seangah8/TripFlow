const DEFAULT_MAX_WIDTH_PX = 400;

// Google's Places API (New) only gives us a photo *resource name*
// (e.g. "places/ABC/photos/XYZ"), not a direct image URL — the actual image
// comes from this media endpoint. Uses the frontend's own public
// VITE_GOOGLE_MAPS_API_KEY (already exposed via the Maps JavaScript SDK script
// tag) rather than the backend's secret GOOGLE_PLACES_API_KEY, which must never
// reach the browser.
export function buildPlacePhotoUrl(photoName: string, maxWidthPx: number = DEFAULT_MAX_WIDTH_PX): string {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  return `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=${maxWidthPx}&key=${apiKey}`;
}
