import { Router } from 'express';
import { generatePlaces } from '../controllers/placeController';

const router = Router();

router.post('/places/generate', generatePlaces);

export default router;
