import { useState } from 'react';
import type { JSX } from 'react';
import { TripWizardModal } from '../components/wizard/TripWizardModal';
import '../styles/HomePage.scss';

export function HomePage(): JSX.Element {
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  return (
    <div className="home-page">
      <h1>TripFlow</h1>
      <p className="home-page__tagline">Plan a trip in minutes.</p>
      <button type="button" className="home-page__add-trip" onClick={() => setIsWizardOpen(true)}>
        Add Trip
      </button>
      {isWizardOpen && <TripWizardModal onClose={() => setIsWizardOpen(false)} />}
    </div>
  );
}
