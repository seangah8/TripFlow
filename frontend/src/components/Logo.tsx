import type { JSX } from 'react';
import { Route } from 'lucide-react';
import '../styles/Logo.scss';

interface LogoProps {
  size?: number;
}

// Uses lucide-react's Route glyph rather than a hand-drawn asset — no
// separate asset file to keep in sync with the rest of the iconography.
export function Logo({ size = 22 }: LogoProps): JSX.Element {
  return (
    <span className="logo">
      <Route size={size} className="logo__icon" />
      <span className="logo__wordmark" style={{ fontSize: `${size * (1.25 / 22)}rem` }}>
        TripFlow
      </span>
    </span>
  );
}
