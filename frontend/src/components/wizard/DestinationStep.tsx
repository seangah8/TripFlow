import type { FormEvent, JSX } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface OccupiedRange {
  startDate: string;
  endDate: string;
  city: string;
}

interface DestinationStepProps {
  city: string;
  onCityChange: (city: string) => void;
  startDate: string;
  onStartDateChange: (date: string) => void;
  endDate: string;
  onEndDateChange: (date: string) => void;
  onNext: () => void;
  occupiedRanges?: OccupiedRange[];
}

// Kept in sync with MAX_TRIP_DAYS in backend/src/api/services/tripService.ts —
// this is a UX nicety (immediate inline feedback), the backend re-validates
// the same rule regardless since it's a real request boundary.
const MAX_TRIP_DAYS = 14;

// react-datepicker works with Date objects; the rest of the app (parent state,
// the backend) works in plain YYYY-MM-DD strings. These helpers keep that
// conversion local to this file rather than spreading Date-handling elsewhere.
function parseDateString(value: string): Date | null {
  if (!value) {
    return null;
  }
  // Constructed from explicit Y/M/D components (not `new Date(value)`) to avoid
  // UTC-midnight-vs-local-timezone off-by-one issues the picker would otherwise
  // introduce when rendering/selecting in local time.
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year!, month! - 1, day!);
}

function formatDateToString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getValidationError(startDate: string, endDate: string, occupiedRanges: OccupiedRange[]): string | null {
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

  const conflict = occupiedRanges.find((range) => startDate <= range.endDate && range.startDate <= endDate);
  if (conflict) {
    return `These dates overlap with your existing trip to ${conflict.city} (${conflict.startDate} – ${conflict.endDate}).`;
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
  occupiedRanges = [],
}: DestinationStepProps): JSX.Element {
  const validationError = getValidationError(startDate, endDate, occupiedRanges);
  const canProceed = Boolean(city.trim() && startDate && endDate && !validationError);

  const excludedIntervals = occupiedRanges.map((range) => ({
    start: parseDateString(range.startDate)!,
    end: parseDateString(range.endDate)!,
  }));

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    onNext();
  }

  return (
    <form className="wizard-step" onSubmit={handleSubmit}>
      <h2>Destination &amp; Dates</h2>
      <input
        type="text"
        className="wizard-step__input"
        value={city}
        onChange={(event) => onCityChange(event.target.value)}
        placeholder="Enter a city"
      />
      <DatePicker
        selected={parseDateString(startDate)}
        onChange={(date: Date | null) => date && onStartDateChange(formatDateToString(date))}
        minDate={new Date()}
        excludeDateIntervals={excludedIntervals}
        placeholderText="Start date"
        aria-label="Start date"
        className="wizard-step__input"
        portalId="datepicker-portal"
      />
      <DatePicker
        selected={parseDateString(endDate)}
        onChange={(date: Date | null) => date && onEndDateChange(formatDateToString(date))}
        minDate={parseDateString(startDate) ?? new Date()}
        excludeDateIntervals={excludedIntervals}
        placeholderText="End date"
        aria-label="End date"
        className="wizard-step__input"
        portalId="datepicker-portal"
      />
      {validationError && <p className="wizard-step__error">{validationError}</p>}
      <button type="submit" disabled={!canProceed}>
        Next
      </button>
    </form>
  );
}
