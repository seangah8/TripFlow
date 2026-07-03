import { useState } from 'react';
import type { JSX } from 'react';
import { DestinationStep } from './DestinationStep';
import '../../styles/wizard.scss';

interface TripWizardModalProps {
  onClose: () => void;
}

export function TripWizardModal({ onClose }: TripWizardModalProps): JSX.Element {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [city, setCity] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

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
          // Placeholder — Step 11 replaces this with the real <PreferencesStep>,
          // which is also where `preferences` state gets added to this component.
          <div className="wizard-step">
            <h2>Preferences (placeholder)</h2>
            <button type="button" onClick={() => setStep(1)}>
              Back
            </button>
            <button type="button" onClick={() => setStep(3)}>
              Next
            </button>
          </div>
        )}

        {step === 3 && (
          // Placeholder — Step 12 replaces this with the real <ConfirmStep>.
          <div className="wizard-step">
            <h2>Confirm (placeholder)</h2>
            <p>
              {city}, {startDate} – {endDate}
            </p>
            <button type="button" onClick={() => setStep(2)}>
              Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
