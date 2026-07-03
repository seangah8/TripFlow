import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
import type { TripPreferences } from '../types/trip';

// No `owner` column yet — the `users` table doesn't exist until the
// persistence/auth session, so there's nothing for it to reference.

// TypeORM populates these fields at runtime (not via constructor), so the
// `!` assertions below are safe despite strict property initialization.
@Entity('trips')
export class Trip {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('varchar')
  city!: string;

  @Column('date')
  startDate!: string;

  @Column('date')
  endDate!: string;

  // Nullable until v4 introduces the preferences wizard — v2's generate flow
  // has nothing to populate this with yet.
  @Column('jsonb', { nullable: true })
  preferences!: TripPreferences | null;

  @CreateDateColumn()
  createdAt!: Date;
}
