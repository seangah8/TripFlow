import { Router } from 'express';
import {
  createVacationHandler,
  listVacationsHandler,
  getVacationHandler,
  addTripToVacationHandler,
} from '../controllers/vacationController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.use(authMiddleware);

router.post('/vacations', createVacationHandler);
router.get('/vacations', listVacationsHandler);
router.get('/vacations/:id', getVacationHandler);
router.post('/vacations/:id/trips', addTripToVacationHandler);

export default router;
