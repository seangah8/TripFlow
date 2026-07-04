// Module augmentation so authMiddleware.ts can set req.userId and every
// downstream handler can read it typed, without a per-handler cast.
declare global {
  namespace Express {
    interface Request {
      userId: string;
    }
  }
}

export {};
