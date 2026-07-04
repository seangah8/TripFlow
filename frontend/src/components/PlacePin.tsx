import type { JSX } from 'react';
import { buildPlacePhotoUrl } from '../utils/placePhoto';
import { NoPhotoIcon } from './NoPhotoIcon';
import '../styles/PlacePin.scss';

interface PlacePinProps {
  photoName: string | null;
  selected: boolean;
}

// The teardrop shape is a rotated square with one squared-off corner (a common
// CSS-only pin trick) — the photo/icon inside is counter-rotated to stay upright.
export function PlacePin({ photoName, selected }: PlacePinProps): JSX.Element {
  return (
    <div className={selected ? 'place-pin place-pin--selected' : 'place-pin'}>
      <div className="place-pin__shape">
        {photoName ? (
          <img className="place-pin__photo" src={buildPlacePhotoUrl(photoName, 100)} alt="" />
        ) : (
          <NoPhotoIcon className="place-pin__fallback-icon" />
        )}
      </div>
    </div>
  );
}
