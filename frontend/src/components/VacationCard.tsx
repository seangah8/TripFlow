import type { JSX } from 'react';
import { Link } from 'react-router-dom';
import type { Vacation } from '../types/vacation';
import { getVacationLabel } from '../utils/vacationLabel';
import '../styles/VacationCard.scss';

interface VacationCardProps {
  vacation: Vacation;
}

export function VacationCard({ vacation }: VacationCardProps): JSX.Element {
  const label = getVacationLabel(vacation);

  return (
    <Link to={`/vacations/${vacation.vacationId}`} className="vacation-card">
      <h3 className="vacation-card__name">{label}</h3>
      <p className="vacation-card__trip-count">
        {vacation.trips.length} {vacation.trips.length === 1 ? 'trip' : 'trips'}
      </p>
    </Link>
  );
}
