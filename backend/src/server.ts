import express from 'express';
import { AppDataSource } from './config/data-source';
import healthRoutes from './api/routes/healthRoutes';
import placesRoutes from './api/routes/placesRoutes';

const app = express();
const port = process.env.PORT;

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
