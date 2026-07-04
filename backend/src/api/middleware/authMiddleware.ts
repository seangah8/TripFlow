import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../services/authService';

// Gates every route it's applied to (see tripRoutes.ts's `router.use(authMiddleware)`) —
// reads the httpOnly session cookie set by authController.ts's register/login handlers.
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies?.token as string | undefined;
  if (!token) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  try {
    const payload = verifyToken(token);
    req.userId = payload.userId;
    next();
  } catch (error) {
    console.error('Invalid or expired token', error);
    res.status(401).json({ error: 'Not authenticated' });
  }
}
