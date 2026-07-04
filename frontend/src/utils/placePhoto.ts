const DEFAULT_MAX_WIDTH_PX = 400;

// Google gives us a photo *resource name*, not a URL — this builds the media endpoint URL.
// Uses the public VITE_GOOGLE_MAPS_API_KEY, never the backend's secret key.
export function buildPlacePhotoUrl(photoName: string, maxWidthPx: number = DEFAULT_MAX_WIDTH_PX): string {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  return `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=${maxWidthPx}&key=${apiKey}`;
}
