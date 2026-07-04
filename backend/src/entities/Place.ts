import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { numericTransformer } from '../utils/numericTransformer';

// TypeORM populates these fields at runtime (not via constructor), so the
// `!` assertions below are safe despite strict property initialization.

// Column types are always given explicitly — tsx/esbuild doesn't reliably emit the
// decorator metadata TypeORM needs to infer one, which crashes at startup.
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

  // Google's photo *resource name*, not a direct image URL — the frontend builds
  // the actual URL with its own public Maps key, so the secret key never reaches the client.
  @Column('varchar', { nullable: true })
  photoName!: string | null;

  @Column('jsonb', { nullable: true })
  openingHours!: Record<string, unknown> | null;

  // Google's primaryTypeDisplayName, shown in the stop list/detail panel.
  @Column('varchar', { nullable: true })
  category!: string | null;
}
