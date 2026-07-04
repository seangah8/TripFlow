import type { JSX } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGenerateTrip } from '../../hooks/useGenerateTrip';
import { useAddTripToVacation } from '../../hooks/useAddTripToVacation';
import type { TripPreferences } from '../../types/trip';

interface ConfirmStepProps {
  city: string;
  startDate: string;
  endDate: string;
  preferences: TripPreferences;
  vacationId?: string;
  onBack: () => void;
  onClose: () => void;
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

export function ConfirmStep({
  city,
  startDate,
  endDate,
  preferences,
  vacationId,
  onBack,
  onClose,
}: ConfirmStepProps): JSX.Element {
  const navigate = useNavigate();
  // Both hooks are called unconditionally (Rules of Hooks) — only the mutation
  // actually matching this wizard's mode (standalone vs. inside a vacation) is
  // used below.
  const generateTripMutation = useGenerateTrip();
  const addTripMutation = useAddTripToVacation(vacationId ?? '');
  const { mutate, isPending, error } = vacationId ? addTripMutation : generateTripMutation;

  function handleGenerate(): void {
    mutate(
      { city, startDate, endDate, preferences },
      {
        // No router state needed — TripPage fetches the trip fresh by id,
        // so the URL works the same whether you land on it from here or a bookmark.
        onSuccess: (trip) => {
          onClose();
          navigate(vacationId ? `/vacations/${vacationId}/trips/${trip.tripId}` : `/trips/${trip.tripId}`);
        },
      },
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
        <button type="button" onClick={onBack} disabled={isPending}>
          Back
        </button>
        <button type="button" onClick={handleGenerate} disabled={isPending}>
          {isPending ? 'Generating…' : 'Generate my trip'}
        </button>
      </div>
    </div>
  );
}
