import { useEffect, useMemo, useState } from 'react';
import type { JSX } from 'react';
import { Link, useParams } from 'react-router-dom';
import { DayTimeline } from '../components/DayTimeline';
import { PlacesMap } from '../components/PlacesMap';
import { StopList } from '../components/StopList';
import { useTrip } from '../hooks/useTrip';
import { buildGoogleMapsDirectionsUrl } from '../utils/googleMapsExport';
import type { TripStop } from '../types/trip';
import '../styles/TripPage.scss';

export function TripPage(): JSX.Element {
  const { vacationId, tripId } = useParams<{ vacationId: string; tripId: string }>();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);
  const { data: trip, isLoading, isError, error } = useTrip(tripId);

  // Day 1 auto-selected on load (and whenever a different trip finishes loading) —
  // there is no more "no day selected" state once a trip exists.
  useEffect(() => {
    if (trip && trip.days.length > 0) {
      setSelectedDate(trip.days[0]!.date);
      setSelectedStopId(null);
    }
  }, [trip]);

  function handleSelectDate(date: string): void {
    setSelectedDate(date);
    // A stop from the previous day no longer applies once the day changes.
    setSelectedStopId(null);
  }

  const currentDayStops = useMemo<TripStop[]>(() => {
    if (!trip || !selectedDate) {
      return [];
    }
    return trip.days.find((day) => day.date === selectedDate)?.stops ?? [];
  }, [trip, selectedDate]);

  if (isLoading) {
    return <p className="trip-page__status">Loading trip…</p>;
  }

  if (isError || !trip) {
    return (
      <div className="trip-page__status">
        <p className="trip-page__error">{error?.message ?? 'Trip not found.'}</p>
        <Link to={`/vacations/${vacationId}`}>← Back to vacation</Link>
      </div>
    );
  }

  return (
    <div className="trip-page">
      <header className="trip-page__header">
        <Link to={`/vacations/${vacationId}`}>← Back to vacation</Link>
        <h1>{trip.city}</h1>
        {currentDayStops.length > 0 && (
          <a
            className="trip-page__maps-export"
            href={buildGoogleMapsDirectionsUrl(currentDayStops)}
            target="_blank"
            rel="noreferrer"
          >
            Open in Google Maps
          </a>
        )}
      </header>
      <div className="trip-page__content">
        <div className="trip-page__side-panel">
          <StopList stops={currentDayStops} selectedStopId={selectedStopId} onSelectStop={setSelectedStopId} />
        </div>
        <main className="trip-page__map">
          <PlacesMap stops={currentDayStops} selectedStopId={selectedStopId} onSelectStop={setSelectedStopId} />
          <DayTimeline days={trip.days} selectedDate={selectedDate} onSelectDate={handleSelectDate} />
        </main>
      </div>
    </div>
  );
}
