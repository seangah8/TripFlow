import { useState } from 'react';
import type { JSX } from 'react';
import { DestinationStep } from './DestinationStep';
import { PreferencesStep } from './PreferencesStep';
import type { TripPreferences } from '../../types/trip';
import '../../styles/wizard.scss';

interface TripWizardModalProps {
  onClose: () => void;
}

// Neutral starting values for the dropdowns — a native <select> always shows something
// selected, so these just need to be reasonable defaults, not a "nothing chosen" state.
// `interests` is the one field with a real empty state (no chips selected).
const DEFAULT_PREFERENCES: TripPreferences = {
  vibe: 'moderate',
  interests: [],
  groupType: 'solo',
  budget: 'mid-range',
};

export function TripWizardModal({ onClose }: TripWizardModalProps): JSX.Element {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [city, setCity] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [preferences, setPreferences] = useState<TripPreferences>(DEFAULT_PREFERENCES);

  return (
    <div className="wizard-modal__backdrop" onClick={onClose}>
      {/* Stop propagation so clicking inside the modal doesn't bubble up and close it. */}
      <div className="wizard-modal" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="wizard-modal__close" onClick={onClose} aria-label="Close">
          ×
        </button>

        {step === 1 && (
          <DestinationStep
            city={city}
            onCityChange={setCity}
            startDate={startDate}
            onStartDateChange={setStartDate}
            endDate={endDate}
            onEndDateChange={setEndDate}
            onNext={() => setStep(2)}
          />
        )}

        {step === 2 && (
          <PreferencesStep
            preferences={preferences}
            onPreferencesChange={setPreferences}
            onNext={() => setStep(3)}
            onBack={() => setStep(1)}
          />
        )}

        {step === 3 && (
          // Placeholder — Step 12 replaces this with the real <ConfirmStep>.
          <div className="wizard-step">
            <h2>Confirm (placeholder)</h2>
            <p>
              {city}, {startDate} – {endDate}
            </p>
            <p>{JSON.stringify(preferences)}</p>
            <button type="button" onClick={() => setStep(2)}>
              Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
