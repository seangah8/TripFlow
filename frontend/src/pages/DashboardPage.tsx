import { useState } from 'react';
import type { JSX } from 'react';
import { Plus } from 'lucide-react';
import { NewVacationModal } from '../components/NewVacationModal';
import { VacationCard } from '../components/VacationCard';
import { useVacations } from '../hooks/useVacations';
import '../styles/DashboardPage.scss';

export function DashboardPage(): JSX.Element {
  const [isNewVacationOpen, setIsNewVacationOpen] = useState(false);
  const { data: vacations, isLoading, isError } = useVacations();

  return (
    <div className="dashboard-page">
      {isLoading && <p className="dashboard-page__status">Loading vacations…</p>}
      {isError && <p className="dashboard-page__status">Couldn't load your vacations.</p>}

      {vacations && (
        <div className="dashboard-page__grid">
          <button type="button" className="dashboard-page__new-vacation" onClick={() => setIsNewVacationOpen(true)}>
            <Plus size={20} />
            New Vacation
          </button>
          {vacations.map((vacation) => (
            <VacationCard key={vacation.vacationId} vacation={vacation} />
          ))}
        </div>
      )}

      {isNewVacationOpen && <NewVacationModal onClose={() => setIsNewVacationOpen(false)} />}
    </div>
  );
}
