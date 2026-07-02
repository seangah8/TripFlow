export interface Place {
  id: string;
  googlePlaceId: string;
  name: string;
  lat: number;
  lng: number;
  city: string;
  rating: number | null;
  photoUrl: string | null;
  openingHours: Record<string, unknown> | null;
}
