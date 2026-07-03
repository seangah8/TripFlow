import { Router } from 'express';
import { generateTripHandler } from '../controllers/tripController';

const router = Router();

router.post('/trips/generate', generateTripHandler);

export default router;
