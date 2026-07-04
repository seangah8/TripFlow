import { useEffect, useRef } from 'react';
import type { JSX } from 'react';
import type { TripStop } from '../types/trip';
import { buildPlacePhotoUrl } from '../utils/placePhoto';
import { NoPhotoIcon } from './NoPhotoIcon';
import '../styles/StopList.scss';

interface StopListProps {
  stops: TripStop[];
  selectedStopId: string | null;
  onSelectStop: (id: string | null) => void;
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
        <StopListItem
          key={stop.tripStopId}
          stop={stop}
          isExpanded={stop.tripStopId === selectedStopId}
          onToggle={() => onSelectStop(stop.tripStopId === selectedStopId ? null : stop.tripStopId)}
        />
      ))}
    </div>
  );
}

interface StopListItemProps {
  stop: TripStop;
  isExpanded: boolean;
  onToggle: () => void;
}

// One row that expands in place to show detail content — replaces the old
// separate StopDetailPanel/"back to list" flow with a single accordion.
function StopListItem({ stop, isExpanded, onToggle }: StopListItemProps): JSX.Element {
  const itemRef = useRef<HTMLDivElement>(null);

  // A map-marker click can select a stop whose row is scrolled out of view —
  // bring it into view whenever it becomes the expanded one.
  useEffect(() => {
    if (isExpanded) {
      itemRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [isExpanded]);

  return (
    <div ref={itemRef} className={isExpanded ? 'stop-list__item stop-list__item--expanded' : 'stop-list__item'}>
      <button type="button" className="stop-list__header" onClick={onToggle}>
        <span className="stop-list__order">{stop.order}</span>
        <span className="stop-list__details">
          <span className="stop-list__name">{stop.place.name}</span>
          <span className="stop-list__category">{stop.place.category ?? 'Uncategorized'}</span>
        </span>
      </button>
      <div className="stop-list__expand">
        <div className="stop-list__expand-inner">
          {stop.estimatedMinutes !== null && <p className="stop-list__minutes">~{stop.estimatedMinutes} min</p>}
          {stop.reasoning !== null && <p className="stop-list__reasoning">{stop.reasoning}</p>}
          {stop.place.photoName ? (
            <img className="stop-list__photo" src={buildPlacePhotoUrl(stop.place.photoName)} alt={stop.place.name} />
          ) : (
            <div className="stop-list__photo-fallback">
              <NoPhotoIcon className="stop-list__fallback-icon" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
