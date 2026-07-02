import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { numericTransformer } from '../utils/numericTransformer';

// TypeORM populates these fields at runtime (not via constructor), so the
// `!` assertions below are safe despite strict property initialization.

// Column types are always given explicitly (e.g. 'varchar') rather than left
// for TypeORM to infer from TS types — tsx/esbuild doesn't reliably emit the
// decorator metadata TypeORM needs to guess a column type, which crashes at startup.
@Entity('places')
export class Place {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('varchar', { unique: true })
  googlePlaceId!: string;

  @Column('varchar')
  name!: string;

  @Column('decimal', { precision: 10, scale: 7, transformer: numericTransformer })
  lat!: number;

  @Column('decimal', { precision: 10, scale: 7, transformer: numericTransformer })
  lng!: number;

  @Column('varchar')
  city!: string;

  @Column('decimal', { precision: 3, scale: 1, nullable: true, transformer: numericTransformer })
  rating!: number | null;

  @Column('varchar', { nullable: true })
  photoUrl!: string | null;

  @Column('jsonb', { nullable: true })
  openingHours!: Record<string, unknown> | null;

  // Google's primaryTypeDisplayName — stored from v1 alongside the rest of the
  // searchText response, unused in the UI until v6's stop list/detail panel.
  @Column('varchar', { nullable: true })
  category!: string | null;
}
