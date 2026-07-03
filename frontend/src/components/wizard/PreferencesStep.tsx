import type { JSX } from 'react';
import type { TripPreferences } from '../../types/trip';

interface PreferencesStepProps {
  preferences: TripPreferences;
  onPreferencesChange: (preferences: TripPreferences) => void;
  onNext: () => void;
  onBack: () => void;
}

type Interest = TripPreferences['interests'][number];

const INTERESTS: Array<{ value: Interest; label: string }> = [
  { value: 'museums', label: 'Museums' },
  { value: 'food', label: 'Food & Drink' },
  { value: 'nature', label: 'Nature' },
  { value: 'nightlife', label: 'Nightlife' },
  { value: 'shopping', label: 'Shopping' },
];

const VIBES: Array<{ value: TripPreferences['vibe']; label: string }> = [
  { value: 'relaxed', label: 'Relaxed' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'packed', label: 'Packed' },
];

const GROUP_TYPES: Array<{ value: TripPreferences['groupType']; label: string }> = [
  { value: 'solo', label: 'Solo' },
  { value: 'couple', label: 'Couple' },
  { value: 'family', label: 'Family with kids' },
  { value: 'friends', label: 'Friends' },
];

const BUDGETS: Array<{ value: TripPreferences['budget']; label: string }> = [
  { value: 'budget', label: 'Budget' },
  { value: 'mid-range', label: 'Mid-range' },
  { value: 'luxury', label: 'Luxury' },
];

export function PreferencesStep({
  preferences,
  onPreferencesChange,
  onNext,
  onBack,
}: PreferencesStepProps): JSX.Element {
  // Zero interests is a valid, intentional choice (BLUE_PRINT.md: falls back to a broad
  // search), so this only ever toggles membership — it never forces a minimum selection.
  function toggleInterest(interest: Interest): void {
    const interests = preferences.interests.includes(interest)
      ? preferences.interests.filter((selected) => selected !== interest)
      : [...preferences.interests, interest];
    onPreferencesChange({ ...preferences, interests });
  }

  return (
    <div className="wizard-step">
      <h2>Preferences</h2>

      <fieldset className="wizard-step__interests">
        <legend>Interests</legend>
        {INTERESTS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            className={
              preferences.interests.includes(value)
                ? 'wizard-step__chip wizard-step__chip--selected'
                : 'wizard-step__chip'
            }
            onClick={() => toggleInterest(value)}
          >
            {label}
          </button>
        ))}
      </fieldset>

      <label className="wizard-step__field">
        Vibe
        <select
          value={preferences.vibe}
          onChange={(event) =>
            onPreferencesChange({ ...preferences, vibe: event.target.value as TripPreferences['vibe'] })
          }
        >
          {VIBES.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>

      <label className="wizard-step__field">
        Group type
        <select
          value={preferences.groupType}
          onChange={(event) =>
            onPreferencesChange({ ...preferences, groupType: event.target.value as TripPreferences['groupType'] })
          }
        >
          {GROUP_TYPES.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>

      <label className="wizard-step__field">
        Budget
        <select
          value={preferences.budget}
          onChange={(event) =>
            onPreferencesChange({ ...preferences, budget: event.target.value as TripPreferences['budget'] })
          }
        >
          {BUDGETS.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>

      <div className="wizard-step__actions">
        <button type="button" onClick={onBack}>
          Back
        </button>
        <button type="button" onClick={onNext}>
          Next
        </button>
      </div>
    </div>
  );
}
