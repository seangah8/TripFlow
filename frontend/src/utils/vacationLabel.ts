import type { Vacation } from '../types/vacation';

// Shared by VacationCard (dashboard) and VacationPage (hub header) so the
// name/city-list/fallback logic can't drift between the two call sites.
export function getVacationLabel(vacation: Vacation): string {
  const trimmedName = vacation.name?.trim();
  if (trimmedName) {
    return trimmedName;
  }
  if (vacation.trips.length > 0) {
    return vacation.trips.map((trip) => trip.city).join(', ');
  }
  return 'New vacation';
}
