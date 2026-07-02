import { useState } from 'react';
import type { JSX } from 'react';
import { CityForm } from '../components/CityForm';
import { PlacesMap } from '../components/PlacesMap';
import { useGeneratePlaces } from '../hooks/useGeneratePlaces';
import '../styles/TripPage.scss';

export function TripPage(): JSX.Element {
  const [city, setCity] = useState('');
  const { mutate, data: places, isPending, error } = useGeneratePlaces();

  function handleGenerate(): void {
    mutate(city.trim());
  }

  return (
    <div className="trip-page">
      <header className="trip-page__header">
        <h1>TripFlow</h1>
        <CityForm city={city} onCityChange={setCity} onGenerate={handleGenerate} isPending={isPending} />
        {error && <p className="trip-page__error">{error.message}</p>}
      </header>
      <main className="trip-page__map">
        <PlacesMap places={places ?? []} />
      </main>
    </div>
  )
}
