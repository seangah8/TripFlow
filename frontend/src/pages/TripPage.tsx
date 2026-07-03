import { useMemo, useState } from 'react';
import type { JSX } from 'react';
import { Link, useParams } from 'react-router-dom';
import { DayTimeline } from '../components/DayTimeline';
import { PlacesMap } from '../components/PlacesMap';
import { useTrip } from '../hooks/useTrip';
import type { Place } from '../types/place';
import '../styles/TripPage.scss';

export function TripPage(): JSX.Element {
  const { tripId } = useParams<{ tripId: string }>();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const { data: trip, isLoading, isError, error } = useTrip(tripId);

  const places = useMemo<Place[]>(() => {
    if (!trip) {
      return [];
    }
    const days = selectedDate ? trip.days.filter((day) => day.date === selectedDate) : trip.days;
    return days.flatMap((day) => day.stops.map((stop) => stop.place));
  }, [trip, selectedDate]);

  if (isLoading) {
    return <p className="trip-page__status">Loading trip…</p>;
  }

  if (isError || !trip) {
    return (
      <div className="trip-page__status">
        <p className="trip-page__error">{error?.message ?? 'Trip not found.'}</p>
        <Link to="/">Back home</Link>
      </div>
    );
  }

  return (
    <div className="trip-page">
      <header className="trip-page__header">
        <Link to="/">TripFlow</Link>
        <h1>{trip.city}</h1>
      </header>
      <main className="trip-page__map">
        <PlacesMap places={places} />
      </main>
      <DayTimeline days={trip.days} selectedDate={selectedDate} onSelectDate={setSelectedDate} />
    </div>
  );
}
