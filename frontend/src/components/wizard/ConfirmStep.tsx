import type { JSX } from 'react';
import { LoadingOverlay } from '../LoadingOverlay';
import type { TripPreferences } from '../../types/trip';

interface ConfirmStepProps {
  city: string;
  startDate: string;
  endDate: string;
  preferences: TripPreferences;
  isPending: boolean;
  error: Error | null;
  onGenerate: () => void;
  onBack: () => void;
}

const INTEREST_LABELS: Record<TripPreferences['interests'][number], string> = {
  museums: 'Museums',
  food: 'Food & Drink',
  nature: 'Nature',
  nightlife: 'Nightlife',
  shopping: 'Shopping',
};

const VIBE_LABELS: Record<TripPreferences['vibe'], string> = {
  relaxed: 'Relaxed',
  moderate: 'Moderate',
  packed: 'Packed',
};

const GROUP_TYPE_LABELS: Record<TripPreferences['groupType'], string> = {
  solo: 'Solo',
  couple: 'Couple',
  family: 'Family with kids',
  friends: 'Friends',
};

const BUDGET_LABELS: Record<TripPreferences['budget'], string> = {
  budget: 'Budget',
  'mid-range': 'Mid-range',
  luxury: 'Luxury',
};

// The mutation itself (useAddTripToVacation) now lives in TripWizardModal,
// not here — it needs to see isPending too, to block the modal from being
// closed mid-generation. This step is purely presentational: summary, the
// generate action, and (while pending) the loading cover in place of its
// own content.
export function ConfirmStep({
  city,
  startDate,
  endDate,
  preferences,
  isPending,
  error,
  onGenerate,
  onBack,
}: ConfirmStepProps): JSX.Element {
  if (isPending) {
    return (
      <div className="wizard-step">
        <LoadingOverlay message="Generating your trip - this can take a minute…" />
      </div>
    );
  }

  return (
    <div className="wizard-step">
      <h2>Confirm</h2>

      <dl className="wizard-step__summary">
        <dt>Destination</dt>
        <dd>{city}</dd>
        <dt>Dates</dt>
        <dd>
          {startDate} – {endDate}
        </dd>
        <dt>Interests</dt>
        <dd>
          {preferences.interests.length > 0
            ? preferences.interests.map((interest) => INTEREST_LABELS[interest]).join(', ')
            : 'None selected'}
        </dd>
        <dt>Vibe</dt>
        <dd>{VIBE_LABELS[preferences.vibe]}</dd>
        <dt>Group</dt>
        <dd>{GROUP_TYPE_LABELS[preferences.groupType]}</dd>
        <dt>Budget</dt>
        <dd>{BUDGET_LABELS[preferences.budget]}</dd>
      </dl>

      {error && <p className="wizard-step__error">{error.message}</p>}

      <div className="wizard-step__actions">
        <button type="button" onClick={onBack}>
          Back
        </button>
        <button type="button" onClick={onGenerate}>
          Generate my trip
        </button>
      </div>
    </div>
  );
}
