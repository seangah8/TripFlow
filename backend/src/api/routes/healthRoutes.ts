import { Router, Request, Response } from 'express';

const router = Router();

router.get('/health', (req: Request, res: Response): void => {
  res.json({ ok: true });
});

export default router;
