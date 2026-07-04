import { useState } from 'react';
import type { JSX } from 'react';
import { Link } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import type { Vacation } from '../types/vacation';
import { getVacationLabel } from '../utils/vacationLabel';
import { useDeleteVacation } from '../hooks/useDeleteVacation';
import { ConfirmDialog } from './ConfirmDialog';
import '../styles/VacationCard.scss';

interface VacationCardProps {
  vacation: Vacation;
}

export function VacationCard({ vacation }: VacationCardProps): JSX.Element {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const { mutate: deleteVacation, isPending } = useDeleteVacation();
  const label = getVacationLabel(vacation);

  return (
    <div className="vacation-card">
      <Link to={`/vacations/${vacation.vacationId}`} className="vacation-card__link">
        <h3 className="vacation-card__name">{label}</h3>
        <p className="vacation-card__trip-count">
          {vacation.trips.length} {vacation.trips.length === 1 ? 'trip' : 'trips'}
        </p>
      </Link>

      <button
        type="button"
        className="vacation-card__delete"
        aria-label={`Delete vacation ${label}`}
        onClick={() => setIsConfirmOpen(true)}
      >
        <Trash2 size={16} />
      </button>

      {isConfirmOpen && (
        <ConfirmDialog
          title="Delete this vacation?"
          message={`This will permanently delete "${label}" and all ${vacation.trips.length} of its ${vacation.trips.length === 1 ? 'trip' : 'trips'}.`}
          isPending={isPending}
          onCancel={() => setIsConfirmOpen(false)}
          onConfirm={() => deleteVacation(vacation.vacationId, { onSuccess: () => setIsConfirmOpen(false) })}
        />
      )}
    </div>
  );
}
