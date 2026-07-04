import type { TripStop } from '../types/trip';

// Google Maps' directions URL accepts a slash-separated "lat,lng" list directly —
// no API call needed. Assumes at least one stop.
export function buildGoogleMapsDirectionsUrl(stops: TripStop[]): string {
  const waypoints = stops.map((stop) => `${stop.place.lat},${stop.place.lng}`).join('/');
  return `https://www.google.com/maps/dir/${waypoints}`;
}
