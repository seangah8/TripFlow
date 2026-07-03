import type { JSX } from 'react';
import type { TripStop } from '../types/trip';
import '../styles/StopList.scss';

interface StopListProps {
  stops: TripStop[];
  selectedStopId: string | null;
  onSelectStop: (id: string) => void;
}

export function StopList({ stops, selectedStopId, onSelectStop }: StopListProps): JSX.Element {
  if (stops.length === 0) {
    return (
      <div className="stop-list">
        <p className="stop-list__empty">No stops for this day.</p>
      </div>
    );
  }

  return (
    <div className="stop-list">
      {stops.map((stop) => (
        <button
          key={stop.tripStopId}
          type="button"
          className={
            stop.tripStopId === selectedStopId ? 'stop-list__item stop-list__item--selected' : 'stop-list__item'
          }
          onClick={() => onSelectStop(stop.tripStopId)}
        >
          <span className="stop-list__order">{stop.order}</span>
          <span className="stop-list__details">
            <span className="stop-list__name">{stop.place.name}</span>
            <span className="stop-list__category">{stop.place.category ?? 'Uncategorized'}</span>
          </span>
        </button>
      ))}
    </div>
  );
}
