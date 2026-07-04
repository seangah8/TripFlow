import type { JSX } from 'react';
import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { buildPlacePhotoUrl } from '../utils/placePhoto';
import type { TripSummary } from '../types/trip';
import '../styles/TripCard.scss';

interface TripCardProps {
  trip: TripSummary;
  vacationId: string;
}

export function TripCard({ trip, vacationId }: TripCardProps): JSX.Element {
  return (
    <Link to={`/vacations/${vacationId}/trips/${trip.tripId}`} className="trip-card">
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
  );
}
