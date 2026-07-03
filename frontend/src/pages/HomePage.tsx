import { useState } from 'react';
import type { JSX } from 'react';
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
      {isWizardOpen && (
        // Placeholder — Step 10 replaces this with the real <TripWizardModal>.
        <div className="home-page__wizard-placeholder">
          <p>Wizard modal placeholder</p>
          <button type="button" onClick={() => setIsWizardOpen(false)}>
            Close
          </button>
        </div>
      )}
    </div>
  );
}
