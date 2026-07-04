import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../../config/data-source';
import { User } from '../../entities/User';
import type { AuthUser } from '../../types/auth';

const SALT_ROUNDS = 12;
const JWT_EXPIRES_IN = '24h';

// bcryptjs (pure JS) over bcrypt (native bindings) — avoids a node-gyp build
// step on this Windows dev machine, at an acceptable cost of a bit of speed.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

export class EmailAlreadyRegisteredError extends Error {}
// One generic error for both "no such email" and "wrong password" — avoids
// leaking which emails are actually registered.
export class InvalidCredentialsError extends Error {}
export class InvalidEmailError extends Error {}
export class WeakPasswordError extends Error {}

function toAuthUser(user: User): AuthUser {
  return { id: user.id, email: user.email };
}

// Fails fast with a clear error if JWT_SECRET isn't set, rather than letting
// jwt.sign/verify throw a less obvious error deeper in the library.
function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not set');
  }
  return secret;
}

function signToken(userId: string): string {
  return jwt.sign({ userId }, getJwtSecret(), { expiresIn: JWT_EXPIRES_IN });
}

export async function registerUser(email: string, password: string): Promise<{ user: AuthUser; token: string }> {
  if (!EMAIL_PATTERN.test(email)) {
    throw new InvalidEmailError('Invalid email address');
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new WeakPasswordError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
  }

  const userRepository = AppDataSource.getRepository(User);
  const existing = await userRepository.findOne({ where: { email } });
  if (existing) {
    throw new EmailAlreadyRegisteredError('Email already registered');
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await userRepository.save(userRepository.create({ email, passwordHash }));

  return { user: toAuthUser(user), token: signToken(user.id) };
}

export async function loginUser(email: string, password: string): Promise<{ user: AuthUser; token: string }> {
  const userRepository = AppDataSource.getRepository(User);
  const user = await userRepository.findOne({ where: { email } });
  if (!user) {
    throw new InvalidCredentialsError('Invalid email or password');
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    throw new InvalidCredentialsError('Invalid email or password');
  }

  return { user: toAuthUser(user), token: signToken(user.id) };
}

export function verifyToken(token: string): { userId: string } {
  return jwt.verify(token, getJwtSecret()) as { userId: string };
}
