import { AppDataSource } from '../config/data-source';
import { Place } from '../entities/Place';

async function seed(): Promise<void> {
  await AppDataSource.initialize();

  await AppDataSource.getRepository(Place).upsert(
    {
      googlePlaceId: 'placeholder-eiffel-tower',
      name: 'Eiffel Tower',
      lat: 48.8584,
      lng: 2.2945,
      city: 'Paris',
    },
    ['googlePlaceId'],
  );

  console.log('Seeded: Eiffel Tower (Paris)');
  await AppDataSource.destroy();
}

seed().catch((error: unknown) => {
  console.error('Seed failed', error);
  process.exit(1);
});
