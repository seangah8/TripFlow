import type { JSX } from 'react';
import { ImageOff } from 'lucide-react';

interface NoPhotoIconProps {
  className?: string;
}

// Shown wherever a Place has no photoName. Sized entirely via the parent's
// CSS (width/height: 100%) — same contract as before this became a lucide icon.
export function NoPhotoIcon({ className }: NoPhotoIconProps): JSX.Element {
  return <ImageOff className={className} strokeWidth={1.5} />;
}
