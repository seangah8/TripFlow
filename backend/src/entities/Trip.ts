import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
import { TripPreferences } from '../types/trip';

// No `owner` column yet — the `users` table doesn't exist until the
// persistence/auth session, so there's nothing for it to reference.
@Entity('trips')
export class Trip {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  city!: string;

  @Column('date')
  startDate!: string;

  @Column('date')
  endDate!: string;

  @Column('jsonb')
  preferences!: TripPreferences;

  @CreateDateColumn()
  createdAt!: Date;
}
