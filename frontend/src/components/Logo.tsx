import type { JSX } from 'react';
import { Route } from 'lucide-react';
import '../styles/Logo.scss';

interface LogoProps {
  size?: number;
}

// The icon + wordmark that represents TripFlow everywhere the app needs
// branding (Header, Login/Register). Uses lucide-react's Route glyph
// (a path between two points) rather than a hand-drawn asset — it's
// already a clean, on-theme icon and needs no separate asset file to keep
// in sync with the rest of the app's iconography.
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
