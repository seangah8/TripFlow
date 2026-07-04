import type { JSX } from 'react';
import { Link } from 'react-router-dom';
import type { TripSummary } from '../types/trip';
import '../styles/TripCard.scss';

interface TripCardProps {
  trip: TripSummary;
}

export function TripCard({ trip }: TripCardProps): JSX.Element {
  return (
    <Link to={`/trips/${trip.tripId}`} className="trip-card">
      <h3 className="trip-card__city">{trip.city}</h3>
      <p className="trip-card__dates">
        {trip.startDate} – {trip.endDate}
      </p>
    </Link>
  );
}
