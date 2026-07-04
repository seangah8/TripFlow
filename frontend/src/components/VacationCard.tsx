import type { JSX } from 'react';
import { Link } from 'react-router-dom';
import type { Vacation } from '../types/vacation';
import '../styles/VacationCard.scss';

interface VacationCardProps {
  vacation: Vacation;
}

export function VacationCard({ vacation }: VacationCardProps): JSX.Element {
  // Falls back to a comma-joined list of the vacation's trip cities when unnamed
  // (BLUE_PRINT.md: "dashboard falls back to listing the cities of its trips if empty").
  const label = vacation.name?.trim()
    ? vacation.name
    : vacation.trips.length > 0
      ? vacation.trips.map((trip) => trip.city).join(', ')
      : 'New vacation';

  return (
    <Link to={`/vacations/${vacation.vacationId}`} className="vacation-card">
      <h3 className="vacation-card__name">{label}</h3>
      <p className="vacation-card__trip-count">
        {vacation.trips.length} {vacation.trips.length === 1 ? 'trip' : 'trips'}
      </p>
    </Link>
  );
}
