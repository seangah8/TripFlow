import type { FormEvent, JSX } from 'react';

interface CityFormProps {
  city: string;
  onCityChange: (city: string) => void;
  onGenerate: () => void;
  isPending: boolean;
}

export function CityForm({ city, onCityChange, onGenerate, isPending }: CityFormProps): JSX.Element {
  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    onGenerate();
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={city}
        onChange={(event) => onCityChange(event.target.value)}
        placeholder="Enter a city"
      />
      <button type="submit" disabled={isPending || !city.trim()}>
        {isPending ? 'Generating...' : 'Generate'}
      </button>
    </form>
  );
}
