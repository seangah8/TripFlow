import type { FormEvent, JSX } from 'react';

interface DestinationStepProps {
  city: string;
  onCityChange: (city: string) => void;
  startDate: string;
  onStartDateChange: (date: string) => void;
  endDate: string;
  onEndDateChange: (date: string) => void;
  onNext: () => void;
}

// Kept in sync with MAX_TRIP_DAYS in backend/src/api/services/tripService.ts —
// this is a UX nicety (immediate inline feedback), the backend re-validates
// the same rule regardless since it's a real request boundary.
const MAX_TRIP_DAYS = 14;

function getValidationError(startDate: string, endDate: string): string | null {
  if (!startDate || !endDate) {
    return null;
  }

  // Date-only strings ("YYYY-MM-DD") parse as UTC midnight, matching how the
  // backend computes the day range — avoids local-timezone off-by-one drift.
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (end < start) {
    return 'End date must be on or after the start date.';
  }

  const dayCount = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  if (dayCount > MAX_TRIP_DAYS) {
    return `Trips can be at most ${MAX_TRIP_DAYS} days long.`;
  }

  return null;
}

export function DestinationStep({
  city,
  onCityChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  onNext,
}: DestinationStepProps): JSX.Element {
  const validationError = getValidationError(startDate, endDate);
  const canProceed = Boolean(city.trim() && startDate && endDate && !validationError);

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    onNext();
  }

  return (
    <form className="wizard-step" onSubmit={handleSubmit}>
      <h2>Destination &amp; Dates</h2>
      <input
        type="text"
        value={city}
        onChange={(event) => onCityChange(event.target.value)}
        placeholder="Enter a city"
      />
      <input
        type="date"
        value={startDate}
        onChange={(event) => onStartDateChange(event.target.value)}
        aria-label="Start date"
      />
      <input
        type="date"
        value={endDate}
        onChange={(event) => onEndDateChange(event.target.value)}
        aria-label="End date"
      />
      {validationError && <p className="wizard-step__error">{validationError}</p>}
      <button type="submit" disabled={!canProceed}>
        Next
      </button>
    </form>
  );
}
