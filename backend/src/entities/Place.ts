import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { numericTransformer } from '../utils/numericTransformer';

// TypeORM populates these fields at runtime (not via constructor), so the
// `!` assertions below are safe despite strict property initialization.
@Entity('places')
export class Place {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  googlePlaceId!: string;

  @Column()
  name!: string;

  @Column('decimal', { precision: 10, scale: 7, transformer: numericTransformer })
  lat!: number;

  @Column('decimal', { precision: 10, scale: 7, transformer: numericTransformer })
  lng!: number;

  @Column()
  city!: string;

  @Column('decimal', { precision: 3, scale: 1, nullable: true, transformer: numericTransformer })
  rating!: number | null;

  @Column({ nullable: true })
  photoUrl!: string | null;

  @Column('jsonb', { nullable: true })
  openingHours!: Record<string, unknown> | null;
}
