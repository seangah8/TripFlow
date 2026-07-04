import { useState } from 'react';
import type { JSX } from 'react';
import { useNavigate } from 'react-router-dom';
import { DestinationStep } from './DestinationStep';
import { PreferencesStep } from './PreferencesStep';
import { ConfirmStep } from './ConfirmStep';
import { useAddTripToVacation } from '../../hooks/useAddTripToVacation';
import type { TripPreferences } from '../../types/trip';
import '../../styles/wizard.scss';

interface TripWizardModalProps {
  vacationId: string;
  occupiedRanges?: Array<{ startDate: string; endDate: string; city: string }>;
  onClose: () => void;
}

// Neutral starting values — a native <select> always shows something selected, so these
// are just reasonable defaults, not a "nothing chosen" state. `interests` is the exception.
const DEFAULT_PREFERENCES: TripPreferences = {
  vibe: 'moderate',
  interests: [],
  groupType: 'solo',
  budget: 'mid-range',
};

export function TripWizardModal({ vacationId, occupiedRanges, onClose }: TripWizardModalProps): JSX.Element {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [city, setCity] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [preferences, setPreferences] = useState<TripPreferences>(DEFAULT_PREFERENCES);
  const navigate = useNavigate();
  // Lifted up from ConfirmStep so this modal can block closing while a generation
  // is in flight — trip generation can take minutes.
  const { mutate, isPending, error } = useAddTripToVacation(vacationId);

  function handleGenerate(): void {
    mutate(
      { city, startDate, endDate, preferences },
      {
        // No router state needed — TripPage fetches the trip fresh by id,
        // so the URL works the same whether you land on it from here or a bookmark.
        onSuccess: (trip) => {
          onClose();
          navigate(`/vacations/${vacationId}/trips/${trip.tripId}`);
        },
      },
    );
  }

  function handleClose(): void {
    if (!isPending) {
      onClose();
    }
  }

  return (
    <div className="wizard-modal__backdrop" onClick={handleClose}>
      <div className="wizard-modal" onClick={(event) => event.stopPropagation()}>
        <button
          type="button"
          className={isPending ? 'wizard-modal__close wizard-modal__close--disabled' : 'wizard-modal__close'}
          onClick={handleClose}
          aria-label="Close"
        >
          ×
        </button>

        <div className="wizard-modal__steps" aria-hidden="true">
          {[1, 2, 3].map((stepNumber) => (
            <span
              key={stepNumber}
              className={
                stepNumber === step ? 'wizard-modal__step wizard-modal__step--active' : 'wizard-modal__step'
              }
            >
              {stepNumber}
            </span>
          ))}
        </div>

        {step === 1 && (
          <DestinationStep
            city={city}
            onCityChange={setCity}
            startDate={startDate}
            onStartDateChange={setStartDate}
            endDate={endDate}
            onEndDateChange={setEndDate}
            occupiedRanges={occupiedRanges}
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
          <ConfirmStep
            city={city}
            startDate={startDate}
            endDate={endDate}
            preferences={preferences}
            isPending={isPending}
            error={error}
            onGenerate={handleGenerate}
            onBack={() => setStep(2)}
          />
        )}
      </div>
    </div>
  );
}
