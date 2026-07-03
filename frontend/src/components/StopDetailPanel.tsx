import type { JSX } from 'react';
import type { TripStop } from '../types/trip';
import '../styles/StopDetailPanel.scss';

interface StopDetailPanelProps {
  stop: TripStop;
  onBack: () => void;
}

export function StopDetailPanel({ stop, onBack }: StopDetailPanelProps): JSX.Element {
  return (
    <div className="stop-detail-panel">
      <button type="button" className="stop-detail-panel__back" onClick={onBack}>
        ← Back to list
      </button>
      <h2 className="stop-detail-panel__name">{stop.place.name}</h2>
      <p className="stop-detail-panel__category">{stop.place.category ?? 'Uncategorized'}</p>
      {stop.estimatedMinutes !== null && <p className="stop-detail-panel__minutes">~{stop.estimatedMinutes} min</p>}
      {stop.reasoning !== null && <p className="stop-detail-panel__reasoning">{stop.reasoning}</p>}
    </div>
  );
}
