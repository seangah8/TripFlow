import { useState } from 'react';
import type { JSX } from 'react';
import { NewVacationModal } from '../components/NewVacationModal';
import { VacationCard } from '../components/VacationCard';
import { useVacations } from '../hooks/useVacations';
import { useLogout } from '../hooks/useLogout';
import { useAuthStore } from '../store/authStore';
import '../styles/DashboardPage.scss';

export function DashboardPage(): JSX.Element {
  const [isNewVacationOpen, setIsNewVacationOpen] = useState(false);
  const user = useAuthStore((state) => state.user);
  const { mutate: logout, isPending: isLoggingOut } = useLogout();
  const { data: vacations, isLoading, isError } = useVacations();

  return (
    <div className="dashboard-page">
      <header className="dashboard-page__header">
        <h1>TripFlow</h1>
        <div className="dashboard-page__account">
          <span>{user?.email}</span>
          <button type="button" onClick={() => logout()} disabled={isLoggingOut}>
            {isLoggingOut ? 'Logging out…' : 'Log out'}
          </button>
        </div>
      </header>

      <button type="button" className="dashboard-page__new-vacation" onClick={() => setIsNewVacationOpen(true)}>
        New Vacation
      </button>

      {isLoading && <p className="dashboard-page__status">Loading vacations…</p>}
      {isError && <p className="dashboard-page__status">Couldn't load your vacations.</p>}
      {vacations && vacations.length === 0 && (
        <p className="dashboard-page__status">No vacations yet — add your first one.</p>
      )}
      {vacations && vacations.length > 0 && (
        <div className="dashboard-page__grid">
          {vacations.map((vacation) => (
            <VacationCard key={vacation.vacationId} vacation={vacation} />
          ))}
        </div>
      )}

      {isNewVacationOpen && <NewVacationModal onClose={() => setIsNewVacationOpen(false)} />}
    </div>
  );
}
