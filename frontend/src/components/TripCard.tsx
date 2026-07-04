import { useState } from 'react';
import type { JSX } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Trash2 } from 'lucide-react';
import { buildPlacePhotoUrl } from '../utils/placePhoto';
import { useDeleteTrip } from '../hooks/useDeleteTrip';
import { ConfirmDialog } from './ConfirmDialog';
import type { TripSummary } from '../types/trip';
import '../styles/TripCard.scss';

interface TripCardProps {
  trip: TripSummary;
  vacationId: string;
}

export function TripCard({ trip, vacationId }: TripCardProps): JSX.Element {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const { mutate: deleteTrip, isPending } = useDeleteTrip(vacationId);

  return (
    <div className="trip-card">
      <Link to={`/vacations/${vacationId}/trips/${trip.tripId}`} className="trip-card__link">
        <div className="trip-card__photo">
          {trip.photoName ? (
            <img src={buildPlacePhotoUrl(trip.photoName)} alt="" className="trip-card__photo-img" />
          ) : (
            <MapPin size={24} className="trip-card__photo-fallback-icon" />
          )}
        </div>
        <div className="trip-card__body">
          <h3 className="trip-card__city">{trip.city}</h3>
          <p className="trip-card__dates">
            {trip.startDate} – {trip.endDate}
          </p>
        </div>
      </Link>

      <button
        type="button"
        className="trip-card__delete"
        aria-label={`Delete trip to ${trip.city}`}
        // Not nested inside the <Link> — a button inside an anchor is invalid
        // HTML and stopPropagation alone wouldn't stop the browser's own
        // navigation on click, so this sits as the Link's sibling instead.
        onClick={() => setIsConfirmOpen(true)}
      >
        <Trash2 size={16} />
      </button>

      {isConfirmOpen && (
        <ConfirmDialog
          title="Delete this trip?"
          message={`This will permanently delete your trip to ${trip.city} (${trip.startDate} – ${trip.endDate}).`}
          isPending={isPending}
          onCancel={() => setIsConfirmOpen(false)}
          onConfirm={() => deleteTrip(trip.tripId, { onSuccess: () => setIsConfirmOpen(false) })}
        />
      )}
    </div>
  );
}
