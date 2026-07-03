import { useMemo, useState } from 'react';
import type { JSX } from 'react';
import { TripForm } from '../components/TripForm';
import { DayTimeline } from '../components/DayTimeline';
import { PlacesMap } from '../components/PlacesMap';
import { useGenerateTrip } from '../hooks/useGenerateTrip';
import type { Place } from '../types/place';
import '../styles/TripPage.scss';

export function TripPage(): JSX.Element {
  const [city, setCity] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const { mutate, data: trip, isPending, error } = useGenerateTrip();

  function handleGenerate(): void {
    mutate({ city: city.trim(), startDate, endDate });
    // A prior trip's selected day may not exist in the new one (different
    // date range), so every fresh generate starts back at "show all".
    setSelectedDate(null);
  }

  const places = useMemo<Place[]>(() => {
    if (!trip) {
      return [];
    }
    const days = selectedDate ? trip.days.filter((day) => day.date === selectedDate) : trip.days;
    return days.flatMap((day) => day.stops.map((stop) => stop.place));
  }, [trip, selectedDate]);

  return (
    <div className="trip-page">
      <header className="trip-page__header">
        <h1>TripFlow</h1>
        <TripForm
          city={city}
          onCityChange={setCity}
          startDate={startDate}
          onStartDateChange={setStartDate}
          endDate={endDate}
          onEndDateChange={setEndDate}
          onGenerate={handleGenerate}
          isPending={isPending}
        />
        {error && <p className="trip-page__error">{error.message}</p>}
      </header>
      <main className="trip-page__map">
        <PlacesMap places={places} />
      </main>
      {trip && <DayTimeline days={trip.days} selectedDate={selectedDate} onSelectDate={setSelectedDate} />}
    </div>
  );
}
