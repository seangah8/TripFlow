import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { AppDataSource } from './config/data-source';
import healthRoutes from './api/routes/healthRoutes';
import tripRoutes from './api/routes/tripRoutes';
import authRoutes from './api/routes/authRoutes';
import vacationRoutes from './api/routes/vacationRoutes';

const app = express();
const port = process.env.PORT;

// Frontend/backend run on different ports, so the browser treats them as different
// origins — `credentials: true` (with a non-wildcard origin) lets the httpOnly cookie cross that gap.
app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use('/api', healthRoutes);
app.use('/api', authRoutes);
app.use('/api', tripRoutes);
app.use('/api', vacationRoutes);

AppDataSource.initialize()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  })
  .catch((error: unknown) => {
    console.error('Failed to initialize database connection', error);
    process.exit(1);
  });
