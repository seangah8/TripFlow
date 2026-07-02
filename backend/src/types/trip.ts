// Shape of Trip.preferences (jsonb) — mirrors BLUE_PRINT.md Section 3's Preferences JSON shape.
export interface TripPreferences {
  vibe: 'relaxed' | 'moderate' | 'packed';
  interests: Array<'museums' | 'food' | 'nature' | 'nightlife' | 'shopping'>;
  groupType: 'solo' | 'couple' | 'family' | 'friends';
  budget: 'budget' | 'mid-range' | 'luxury';
}
