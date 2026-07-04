import { AppDataSource } from '../config/data-source';
import { generateTrip } from '../api/services/tripService';
import { User } from '../entities/User';
import type { TripPreferences } from '../types/trip';

// Fixed, hand-picked test fixture — deliberately never varies between runs, so a human (or
// Claude Code) can compare today's output against a previous run and immediately spot a
// regression (an empty day, wildly off-theme places, a curated-count drop, a thrown error).
const TEST_CITY = 'Lisbon';
const TEST_START_DATE = '2026-09-01';
const TEST_END_DATE = '2026-09-04'; // 4 days
const TEST_PREFERENCES: TripPreferences = {
  vibe: 'moderate',
  interests: ['museums', 'food'],
  groupType: 'couple',
  budget: 'mid-range',
};

// Trip.ownerId is a real FK to users — this script needs some User row to
// attach generated trips to. Fixed test email, reused (not recreated) across
// runs; the password hash is never used since this account never logs in.
const TEST_OWNER_EMAIL = 'test-ai-pipeline@tripflow.local';

async function getOrCreateTestOwner(): Promise<User> {
  const userRepository = AppDataSource.getRepository(User);
  const existing = await userRepository.findOne({ where: { email: TEST_OWNER_EMAIL } });
  if (existing) {
    return existing;
  }
  return userRepository.save(
    userRepository.create({ email: TEST_OWNER_EMAIL, passwordHash: 'unused-test-fixture-account' }),
  );
}

async function run(): Promise<void> {
  await AppDataSource.initialize();

  const owner = await getOrCreateTestOwner();

  const start = Date.now();
  const trip = await generateTrip(TEST_CITY, TEST_START_DATE, TEST_END_DATE, TEST_PREFERENCES, owner.id);
  const elapsedSeconds = ((Date.now() - start) / 1000).toFixed(1);

  const totalStops = trip.days.reduce((sum, day) => sum + day.stops.length, 0);

  console.log(`=== /test-ai-pipeline: ${trip.city}, ${trip.startDate} -> ${trip.endDate} (${trip.days.length} days) ===`);
  console.log(
    `Preferences: vibe=${TEST_PREFERENCES.vibe}, interests=${TEST_PREFERENCES.interests.join(',')}, ` +
      `groupType=${TEST_PREFERENCES.groupType}, budget=${TEST_PREFERENCES.budget}`,
  );
  console.log('');

  for (const day of trip.days) {
    console.log(`Day (${day.date}) - ${day.stops.length} stop${day.stops.length === 1 ? '' : 's'}`);
    day.stops.forEach((stop) => {
      const rating = stop.place.rating !== null ? stop.place.rating.toFixed(1) : 'n/a';
      const minutes = stop.estimatedMinutes !== null ? `${stop.estimatedMinutes} min` : 'n/a';
      console.log(
        `  ${stop.order}. ${stop.place.name} (rating ${rating}, category: ${stop.place.category ?? 'n/a'}, ~${minutes})`,
      );
      console.log(`     reasoning: ${stop.reasoning ?? 'n/a'}`);
    });
    console.log('');
  }

  console.log(`Totals: ${totalStops} curated place(s) across ${trip.days.length} day(s)`);
  console.log(`Elapsed: ${elapsedSeconds}s`);
  console.log(`Trip id (dev DB row, not cleaned up): ${trip.tripId}`);

  await AppDataSource.destroy();
}

run().catch((error: unknown) => {
  console.error('/test-ai-pipeline failed', error);
  process.exit(1);
});
