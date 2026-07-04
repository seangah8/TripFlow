import { useState } from 'react';
import type { JSX } from 'react';
import { Link, useParams } from 'react-router-dom';
import { TripCard } from '../components/TripCard';
import { TripWizardModal } from '../components/wizard/TripWizardModal';
import { useVacation } from '../hooks/useVacation';
import { getVacationLabel } from '../utils/vacationLabel';
import '../styles/VacationPage.scss';

export function VacationPage(): JSX.Element {
  const { vacationId } = useParams<{ vacationId: string }>();
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const { data: vacation, isLoading, isError, error } = useVacation(vacationId);

  if (isLoading) {
    return <p className="vacation-page__status">Loading vacation…</p>;
  }

  if (isError || !vacation) {
    return (
      <div className="vacation-page__status">
        <p className="vacation-page__error">{error?.message ?? 'Vacation not found.'}</p>
        <Link to="/">Back home</Link>
      </div>
    );
  }

  return (
    <div className="vacation-page">
      <h1 className="vacation-page__title">{getVacationLabel(vacation)}</h1>

      <button type="button" className="vacation-page__add-city" onClick={() => setIsWizardOpen(true)}>
        Add a city
      </button>

      {vacation.trips.length === 0 && (
        <p className="vacation-page__status">No cities yet — add your first one.</p>
      )}
      {vacation.trips.length > 0 && (
        <div className="vacation-page__grid">
          {vacation.trips.map((trip) => (
            <TripCard key={trip.tripId} trip={trip} vacationId={vacation.vacationId} />
          ))}
        </div>
      )}

      {isWizardOpen && (
        <TripWizardModal
          vacationId={vacation.vacationId}
          occupiedRanges={vacation.trips.map((trip) => ({
            startDate: trip.startDate,
            endDate: trip.endDate,
            city: trip.city,
          }))}
          onClose={() => setIsWizardOpen(false)}
        />
      )}
    </div>
  );
}
