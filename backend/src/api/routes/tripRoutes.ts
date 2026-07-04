import { Router } from 'express';
import { generateTripHandler, getTripHandler, listTripsHandler, deleteTripHandler } from '../controllers/tripController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Every route in this file needs auth in v7 — a blanket guard here is harder
// to accidentally miss than repeating authMiddleware on each route.
router.use(authMiddleware);

router.post('/trips/generate', generateTripHandler);
router.get('/trips', listTripsHandler);
router.get('/trips/:id', getTripHandler);
router.delete('/trips/:id', deleteTripHandler);

export default router;
