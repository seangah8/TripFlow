import type { JSX } from 'react';
import { Link } from 'react-router-dom';
import type { TripSummary } from '../types/trip';
import '../styles/TripCard.scss';

interface TripCardProps {
  trip: TripSummary;
  vacationId: string;
}

export function TripCard({ trip, vacationId }: TripCardProps): JSX.Element {
  return (
    <Link to={`/vacations/${vacationId}/trips/${trip.tripId}`} className="trip-card">
      <h3 className="trip-card__city">{trip.city}</h3>
      <p className="trip-card__dates">
        {trip.startDate} – {trip.endDate}
      </p>
    </Link>
  );
}
