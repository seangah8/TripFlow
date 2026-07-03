import type { JSX } from 'react';
import type { TripDay } from '../types/trip';

interface DayTimelineProps {
  days: TripDay[];
  selectedDate: string | null;
  onSelectDate: (date: string | null) => void;
}

export function DayTimeline({ days, selectedDate, onSelectDate }: DayTimelineProps): JSX.Element {
  // Clicking the already-selected day deselects it, returning to the
  // "show every day's places" default view.
  function handleClick(date: string): void {
    onSelectDate(selectedDate === date ? null : date);
  }

  return (
    <div className="day-timeline">
      {days.map((day) => (
        <button
          key={day.date}
          type="button"
          className={
            day.date === selectedDate ? 'day-timeline__card day-timeline__card--selected' : 'day-timeline__card'
          }
          onClick={() => handleClick(day.date)}
        >
          <span className="day-timeline__date">{day.date}</span>
          <span className="day-timeline__count">{day.stops.length} stops</span>
        </button>
      ))}
    </div>
  );
}
