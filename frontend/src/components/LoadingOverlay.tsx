import type { JSX } from 'react';
import '../styles/LoadingOverlay.scss';

interface LoadingOverlayProps {
  message?: string;
  // 'full': an animated route drawing itself between two pins — reserved for
  // genuinely long waits (trip generation). 'inline': a small spinning ring
  // for quick page loads that don't need the same visual weight.
  variant?: 'full' | 'inline';
}

export function LoadingOverlay({ message, variant = 'full' }: LoadingOverlayProps): JSX.Element {
  if (variant === 'inline') {
    return (
      <div className="loading-overlay loading-overlay--inline">
        <span className="loading-overlay__spinner" aria-hidden="true" />
        {message && <span className="loading-overlay__message">{message}</span>}
      </div>
    );
  }

  return (
    <div className="loading-overlay loading-overlay--full">
      <svg className="loading-route" viewBox="0 0 100 40" aria-hidden="true">
        {/* A long, smoothly-curved road with an actual loop in the middle —
            the loop is a bezier segment whose start/end anchor is the same
            point with wide swinging control points, which is what makes the
            curve cross itself into a circle shape rather than just bulging.
            pathLength="100" keeps the dash-draw animation's math exact
            regardless of how winding the path actually is. */}
        <path
          className="loading-route__path"
          d="M8 32 C18 14 28 10 34 20 C42 32 14 32 22 18 C28 8 42 2 50 14 C56 24 68 28 72 16 C76 4 84 2 92 8"
          pathLength={100}
        />
        <circle className="loading-route__pin" cx="8" cy="32" r="4" />
        <circle className="loading-route__pin" cx="92" cy="8" r="4" />
      </svg>
      {message && <p className="loading-overlay__message">{message}</p>}
    </div>
  );
}
