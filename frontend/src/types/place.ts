export interface Place {
  id: string;
  googlePlaceId: string;
  name: string;
  lat: number;
  lng: number;
  city: string;
  rating: number | null;
  // Google's photo *resource name* (e.g. "places/ABC/photos/XYZ"), not a direct
  // image URL — see utils/placePhoto.ts for how this becomes an actual <img src>.
  photoName: string | null;
  openingHours: Record<string, unknown> | null;
  category: string | null;
}
