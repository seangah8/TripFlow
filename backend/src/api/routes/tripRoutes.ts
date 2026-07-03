import { Router } from 'express';
import { generateTripHandler, getTripHandler } from '../controllers/tripController';

const router = Router();

router.post('/trips/generate', generateTripHandler);
router.get('/trips/:id', getTripHandler);

export default router;
