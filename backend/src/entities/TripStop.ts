import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Trip } from './Trip';
import { Place } from './Place';

// TypeORM populates these fields at runtime (not via constructor), so the
// `!` assertions below are safe despite strict property initialization.
@Entity('trip_stops')
export class TripStop {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  tripId!: string;

  // Cascade delete: removing a trip removes its stops. Places are a shared
  // catalog (BLUE_PRINT.md Section 3) so no cascade on that side.
  @ManyToOne(() => Trip, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'trip_id' })
  trip!: Trip;

  @Column('uuid')
  placeId!: string;

  @ManyToOne(() => Place)
  @JoinColumn({ name: 'place_id' })
  place!: Place;

  @Column('date')
  date!: string;

  @Column('int')
  order!: number;

  @Column('int')
  estimatedMinutes!: number;

  @Column('text', { nullable: true })
  reasoning!: string | null;
}
