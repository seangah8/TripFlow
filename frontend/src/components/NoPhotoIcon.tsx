import type { JSX } from 'react';

interface NoPhotoIconProps {
  className?: string;
}

// A generic "image placeholder" glyph (mountain + sun), shown wherever a Place
// has no photoName. Sized entirely via the parent's CSS (width/height: 100%).
export function NoPhotoIcon({ className }: NoPhotoIconProps): JSX.Element {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="8.5" cy="10.5" r="1.5" fill="currentColor" />
      <path d="M21 16l-5.5-5.5-4 4L8 11l-5 5" stroke="currentColor" strokeWidth="1.5" fill="none" />
    </svg>
  );
}
