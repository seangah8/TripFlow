import type { JSX } from 'react';
import type { TripDay } from '../types/trip';

interface DayTimelineProps {
  days: TripDay[];
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
}

export function DayTimeline({ days, selectedDate, onSelectDate }: DayTimelineProps): JSX.Element {
  return (
    <div className="day-timeline">
      {days.map((day) => (
        <button
          key={day.date}
          type="button"
          className={
            day.date === selectedDate ? 'day-timeline__card day-timeline__card--selected' : 'day-timeline__card'
          }
          onClick={() => onSelectDate(day.date)}
        >
          <span className="day-timeline__date">{day.date}</span>
          <span className="day-timeline__count">{day.stops.length} stops</span>
        </button>
      ))}
    </div>
  );
}
