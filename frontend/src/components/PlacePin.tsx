import type { JSX } from 'react';
import '../styles/PlacePin.scss';

interface PlacePinProps {
  photoUrl: string | null;
  selected: boolean;
}

// The teardrop shape is a rotated square with one squared-off corner (a common
// CSS-only pin trick) — the photo/icon inside is counter-rotated to stay upright.
export function PlacePin({ photoUrl, selected }: PlacePinProps): JSX.Element {
  return (
    <div className={selected ? 'place-pin place-pin--selected' : 'place-pin'}>
      <div className="place-pin__shape">
        {photoUrl ? (
          <img className="place-pin__photo" src={photoUrl} alt="" />
        ) : (
          <svg className="place-pin__fallback-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="8.5" cy="10.5" r="1.5" fill="currentColor" />
            <path d="M21 16l-5.5-5.5-4 4L8 11l-5 5" stroke="currentColor" strokeWidth="1.5" fill="none" />
          </svg>
        )}
      </div>
    </div>
  );
}
