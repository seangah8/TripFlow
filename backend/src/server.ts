import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { AppDataSource } from './config/data-source';
import healthRoutes from './api/routes/healthRoutes';
import tripRoutes from './api/routes/tripRoutes';
import authRoutes from './api/routes/authRoutes';

const app = express();
const port = process.env.PORT;

// Frontend and backend run on different ports (5173 / 3001), so the browser
// treats them as different origins — CORS must allow the frontend's origin
// explicitly for its direct fetch() calls to succeed. `credentials: true` is
// required (alongside a non-wildcard origin) for the browser to send/accept
// the httpOnly session cookie across that origin difference.
app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use('/api', healthRoutes);
app.use('/api', authRoutes);
app.use('/api', tripRoutes);

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
