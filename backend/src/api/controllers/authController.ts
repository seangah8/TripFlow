import { Request, Response } from 'express';
import {
  registerUser,
  loginUser,
  EmailAlreadyRegisteredError,
  InvalidCredentialsError,
  InvalidEmailError,
  WeakPasswordError,
} from '../services/authService';
import { AppDataSource } from '../../config/data-source';
import { User } from '../../entities/User';
import type { RegisterRequest, LoginRequest } from '../../types/auth';

const SESSION_COOKIE_MAX_AGE_MS = 24 * 60 * 60 * 1000;

const isProduction = process.env.NODE_ENV === 'production';

function setSessionCookie(res: Response, token: string): void {
  res.cookie('token', token, {
    httpOnly: true,
    // Production serves frontend/backend from different domains (Vercel/Render), which
    // needs sameSite: 'none' for the cookie to cross that gap — but browsers only honor
    // 'none' when secure is also true, hence both being tied to the same NODE_ENV check.
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: SESSION_COOKIE_MAX_AGE_MS,
  });
}

export async function registerHandler(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body as Partial<RegisterRequest>;

  if (typeof email !== 'string' || typeof password !== 'string') {
    res.status(400).json({ error: 'email and password are required' });
    return;
  }

  try {
    const { user, token } = await registerUser(email, password);
    setSessionCookie(res, token);
    res.status(201).json({ user });
  } catch (error) {
    if (error instanceof EmailAlreadyRegisteredError) {
      res.status(409).json({ error: error.message });
      return;
    }
    if (error instanceof InvalidEmailError || error instanceof WeakPasswordError) {
      res.status(400).json({ error: error.message });
      return;
    }
    console.error('Failed to register user', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
}

export async function loginHandler(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body as Partial<LoginRequest>;

  if (typeof email !== 'string' || typeof password !== 'string') {
    res.status(400).json({ error: 'email and password are required' });
    return;
  }

  try {
    const { user, token } = await loginUser(email, password);
    setSessionCookie(res, token);
    res.json({ user });
  } catch (error) {
    if (error instanceof InvalidCredentialsError) {
      res.status(401).json({ error: error.message });
      return;
    }
    console.error('Failed to log in', error);
    res.status(500).json({ error: 'Failed to log in' });
  }
}

// No auth required — logging out an already-logged-out session is harmless.
export function logoutHandler(req: Request, res: Response): void {
  // clearCookie needs the same secure/sameSite attributes used to set the cookie —
  // browsers won't reliably clear it otherwise.
  res.clearCookie('token', { httpOnly: true, secure: isProduction, sameSite: isProduction ? 'none' : 'lax' });
  res.json({ ok: true });
}

// Behind authMiddleware — the frontend calls this once on app load to learn
// whether the httpOnly cookie (which its own JS can't read) is still valid.
export async function meHandler(req: Request, res: Response): Promise<void> {
  try {
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { id: req.userId } });
    if (!user) {
      // The token was valid but the user row is gone (e.g. deleted after
      // the token was issued) — treat it the same as "not authenticated".
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    res.json({ user: { id: user.id, email: user.email } });
  } catch (error) {
    console.error('Failed to load current user', error);
    res.status(500).json({ error: 'Failed to load current user' });
  }
}
