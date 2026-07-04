import { useEffect } from 'react';
import type { JSX } from 'react';
import { AdvancedMarker, APIProvider, Map, useMap } from '@vis.gl/react-google-maps';
import type { TripStop } from '../types/trip';
import { PlacePin } from './PlacePin';

interface PlacesMapProps {
  stops: TripStop[];
  selectedStopId: string | null;
  onSelectStop: (id: string) => void;
}

// No results yet — a neutral world view rather than defaulting to any one city.
const DEFAULT_CENTER = { lat: 20, lng: 0 };
const DEFAULT_ZOOM = 2;

// Separate child component because useMap() only works inside the <Map> tree
// (it reads the map instance from vis.gl's internal context). Fires on the
// initial load and every day switch (stops array changes), never on a stop
// selection alone.
function FitBoundsToPlaces({ stops }: { stops: TripStop[] }): null {
  const map = useMap();

  useEffect(() => {
    if (!map || stops.length === 0) {
      return;
    }

    const bounds = new google.maps.LatLngBounds();
    stops.forEach((stop) => bounds.extend({ lat: stop.place.lat, lng: stop.place.lng }));
    map.fitBounds(bounds);
  }, [map, stops]);

  return null;
}

// Pans (never zooms) to the selected stop's marker. Keyed on selectedStopId, not
// stops — switching days always clears selectedStopId back to null first (see
// TripPage), so this effect only ever fires from an explicit stop selection and
// never fights with FitBoundsToPlaces on a day switch.
function PanToSelectedStop({ stops, selectedStopId }: { stops: TripStop[]; selectedStopId: string | null }): null {
  const map = useMap();

  useEffect(() => {
    if (!map || !selectedStopId) {
      return;
    }
    const stop = stops.find((s) => s.tripStopId === selectedStopId);
    if (!stop) {
      return;
    }
    map.panTo({ lat: stop.place.lat, lng: stop.place.lng });
  }, [map, stops, selectedStopId]);

  return null;
}

export function PlacesMap({ stops, selectedStopId, onSelectStop }: PlacesMapProps): JSX.Element {
  return (
    <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY} libraries={['marker']}>
      <Map
        style={{ width: '100%', height: '100%' }}
        defaultCenter={DEFAULT_CENTER}
        defaultZoom={DEFAULT_ZOOM}
        mapId={import.meta.env.VITE_GOOGLE_MAPS_MAP_ID}
      >
        {stops.map((stop) => (
          <AdvancedMarker
            key={stop.tripStopId}
            position={{ lat: stop.place.lat, lng: stop.place.lng }}
            onClick={() => onSelectStop(stop.tripStopId)}
          >
            <PlacePin photoName={stop.place.photoName} selected={stop.tripStopId === selectedStopId} />
          </AdvancedMarker>
        ))}
        <FitBoundsToPlaces stops={stops} />
        <PanToSelectedStop stops={stops} selectedStopId={selectedStopId} />
      </Map>
    </APIProvider>
  );
}
