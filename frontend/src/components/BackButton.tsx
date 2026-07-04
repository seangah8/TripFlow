import type { JSX } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import '../styles/BackButton.scss';

interface BackButtonProps {
  to: string;
  label: string;
}

// Plain icon-only back link — a floating circular button (rounded, shadow,
// primary-color icon), reused wherever a page needs a "back" affordance
// without a full text header (TripPage, VacationPage).
export function BackButton({ to, label }: BackButtonProps): JSX.Element {
  return (
    <Link to={to} className="back-button" aria-label={label}>
      <ArrowLeft size={20} />
    </Link>
  );
}
