import { useState } from 'react';
import type { JSX } from 'react';
import { TripWizardModal } from '../components/wizard/TripWizardModal';
import { TripCard } from '../components/TripCard';
import { useTrips } from '../hooks/useTrips';
import { useLogout } from '../hooks/useLogout';
import { useAuthStore } from '../store/authStore';
import '../styles/DashboardPage.scss';

export function DashboardPage(): JSX.Element {
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const user = useAuthStore((state) => state.user);
  const { mutate: logout, isPending: isLoggingOut } = useLogout();
  const { data: trips, isLoading, isError } = useTrips();

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

      <button type="button" className="dashboard-page__add-trip" onClick={() => setIsWizardOpen(true)}>
        Add Trip
      </button>

      {isLoading && <p className="dashboard-page__status">Loading trips…</p>}
      {isError && <p className="dashboard-page__status">Couldn't load your trips.</p>}
      {trips && trips.length === 0 && (
        <p className="dashboard-page__status">No trips yet — add your first one.</p>
      )}
      {trips && trips.length > 0 && (
        <div className="dashboard-page__grid">
          {trips.map((trip) => (
            <TripCard key={trip.tripId} trip={trip} />
          ))}
        </div>
      )}

      {isWizardOpen && <TripWizardModal onClose={() => setIsWizardOpen(false)} />}
    </div>
  );
}
