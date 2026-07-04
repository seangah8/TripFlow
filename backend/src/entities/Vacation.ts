import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User';

@Entity('vacations')
export class Vacation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // Optional user label — falls back to a comma-joined list of the vacation's
  // trip cities when null (see VacationCard.tsx).
  @Column('varchar', { nullable: true })
  name!: string | null;

  @Column('uuid')
  ownerId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'owner_id' })
  owner!: User;

  @CreateDateColumn()
  createdAt!: Date;
}
