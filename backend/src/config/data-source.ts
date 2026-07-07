import 'reflect-metadata';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { Place } from '../entities/Place';
import { Trip } from '../entities/Trip';
import { TripStop } from '../entities/TripStop';
import { User } from '../entities/User';
import { Vacation } from '../entities/Vacation';

config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  // Managed Postgres providers (Render, Neon, etc.) require SSL for external connections
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  namingStrategy: new SnakeNamingStrategy(),
  synchronize: true,
  entities: [Place, Trip, TripStop, User, Vacation],
});
