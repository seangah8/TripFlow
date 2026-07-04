import type { TripStop } from '../types/trip';

// Pure string-formatting, no external API call needed — Google Maps'
// directions URL format accepts a slash-separated list of "lat,lng"
// waypoints directly. Assumes at least one stop; callers should only render
// the resulting link when the day actually has stops.
export function buildGoogleMapsDirectionsUrl(stops: TripStop[]): string {
  const waypoints = stops.map((stop) => `${stop.place.lat},${stop.place.lng}`).join('/');
  return `https://www.google.com/maps/dir/${waypoints}`;
}
