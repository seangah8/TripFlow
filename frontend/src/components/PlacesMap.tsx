import { useEffect } from 'react';
import type { JSX } from 'react';
import { APIProvider, Map, Marker, useMap } from '@vis.gl/react-google-maps';
import type { Place } from '../types/place';

interface PlacesMapProps {
  places: Place[];
}

// No results yet — a neutral world view rather than defaulting to any one city.
const DEFAULT_CENTER = { lat: 20, lng: 0 };
const DEFAULT_ZOOM = 2;

// Separate child component because useMap() only works inside the <Map> tree
// (it reads the map instance from vis.gl's internal context).
function FitBoundsToPlaces({ places }: { places: Place[] }): null {
  const map = useMap();

  useEffect(() => {
    if (!map || places.length === 0) {
      return;
    }

    const bounds = new google.maps.LatLngBounds();
    places.forEach((place) => bounds.extend({ lat: place.lat, lng: place.lng }));
    map.fitBounds(bounds);
  }, [map, places]);

  return null;
}

export function PlacesMap({ places }: PlacesMapProps): JSX.Element {
  return (
    <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
      <Map
        style={{ width: '100%', height: '100%' }}
        defaultCenter={DEFAULT_CENTER}
        defaultZoom={DEFAULT_ZOOM}
      >
        {places.map((place) => (
          <Marker key={place.id} position={{ lat: place.lat, lng: place.lng }} title={place.name} />
        ))}
        <FitBoundsToPlaces places={places} />
      </Map>
    </APIProvider>
  );
}
