import { useState } from 'react';
import type { JSX } from 'react';
import { Link } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import type { Vacation } from '../types/vacation';
import { getVacationLabel } from '../utils/vacationLabel';
import { buildPlacePhotoUrl } from '../utils/placePhoto';
import { useDeleteVacation } from '../hooks/useDeleteVacation';
import { ConfirmDialog } from './ConfirmDialog';
import '../styles/VacationCard.scss';

interface VacationCardProps {
  vacation: Vacation;
}

// Faint background collage, up to this many of the vacation's earliest trips —
// each trip contributes its own first-stop photo (or no image, if it doesn't
// have one yet), not "the first N photos found."
const COLLAGE_LIMIT = 4;

export function VacationCard({ vacation }: VacationCardProps): JSX.Element {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const { mutate: deleteVacation, isPending } = useDeleteVacation();
  const label = getVacationLabel(vacation);
  const cityCount = vacation.trips.length;

  const collagePhotos = vacation.trips
    .slice(0, COLLAGE_LIMIT)
    .map((trip) => trip.photoName)
    .filter((photoName): photoName is string => Boolean(photoName));

  return (
    <div className="vacation-card">
      {collagePhotos.length > 0 && (
        <div className={`vacation-card__collage vacation-card__collage--count-${collagePhotos.length}`}>
          {collagePhotos.map((photoName, index) => (
            <img
              key={index}
              className="vacation-card__collage-img"
              src={buildPlacePhotoUrl(photoName)}
              alt=""
              aria-hidden="true"
            />
          ))}
        </div>
      )}

      <Link to={`/vacations/${vacation.vacationId}`} className="vacation-card__link">
        <h3 className="vacation-card__name">{label}</h3>
        <p className="vacation-card__trip-count">
          {cityCount} {cityCount === 1 ? 'city' : 'cities'}
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
          message={`This will permanently delete "${label}" and all ${cityCount} of its ${cityCount === 1 ? 'trip' : 'trips'}.`}
          isPending={isPending}
          onCancel={() => setIsConfirmOpen(false)}
          onConfirm={() => deleteVacation(vacation.vacationId, { onSuccess: () => setIsConfirmOpen(false) })}
        />
      )}
    </div>
  );
}
