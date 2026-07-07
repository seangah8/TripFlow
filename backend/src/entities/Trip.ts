import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import type { TripPreferences } from '../types/trip';
import { User } from './User';
import { Vacation } from './Vacation';

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

  // Nullable — older trips predating the preferences wizard have nothing here.
  @Column('jsonb', { nullable: true })
  preferences!: TripPreferences | null;

  @Column('uuid')
  ownerId!: string;

  // Deleting a user deletes their trips (TripStop already cascades off Trip,
  // so this keeps the whole ownership chain consistent end to end).
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'owner_id' })
  owner!: User;

  // Resolved once at generation time from Claude's iconic-place pick
  @Column('varchar', { nullable: true })
  photoName!: string | null;

  @Column('uuid', { nullable: true })
  vacationId!: string | null;

  @ManyToOne(() => Vacation, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'vacation_id' })
  vacation!: Vacation | null;

  @CreateDateColumn()
  createdAt!: Date;
}
