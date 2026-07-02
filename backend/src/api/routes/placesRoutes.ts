import { Router } from 'express';
import { generatePlaces } from '../controllers/placesController';

const router = Router();

router.post('/places/generate', generatePlaces);

export default router;
