import type { JSX } from 'react';
import type { TripDay } from '../types/trip';
import '../styles/DayTimeline.scss';

interface DayTimelineProps {
  days: TripDay[];
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
}

// Formats the "YYYY-MM-DD" string's own digits directly instead of going
// through Date, which would risk a UTC shift.
function formatShortDate(isoDate: string): string {
  const [, month, day] = isoDate.split('-');
  return `${Number(day)}.${Number(month)}`;
}

// Past this many days, cards shrink so the row doesn't overflow toward the
// map's edges — trips can run up to 14 days (MAX_TRIP_DAYS).
const COMPACT_THRESHOLD = 8;

export function DayTimeline({ days, selectedDate, onSelectDate }: DayTimelineProps): JSX.Element {
  const isCompact = days.length > COMPACT_THRESHOLD;

  return (
    <div className={isCompact ? 'day-timeline day-timeline--compact' : 'day-timeline'}>
      {days.map((day) => (
        <button
          key={day.date}
          type="button"
          className={
            day.date === selectedDate ? 'day-timeline__card day-timeline__card--selected' : 'day-timeline__card'
          }
          onClick={() => onSelectDate(day.date)}
        >
          {formatShortDate(day.date)}
        </button>
      ))}
    </div>
  );
}
