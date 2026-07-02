import express from 'express';
import cors from 'cors';
import { AppDataSource } from './config/data-source';
import healthRoutes from './api/routes/healthRoutes';
import placesRoutes from './api/routes/placesRoutes';

const app = express();
const port = process.env.PORT;

// Frontend and backend run on different ports (5173 / 3001), so the browser
// treats them as different origins — CORS must allow the frontend's origin
// explicitly for its direct fetch() calls to succeed.
app.use(cors({ origin: process.env.CORS_ORIGIN }));
app.use(express.json());

app.use('/api', healthRoutes);
app.use('/api', placesRoutes);

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
