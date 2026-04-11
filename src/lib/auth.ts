import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateJWT(payload: { userId: string; username: string }): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET no definido");
  }
  return jwt.sign(payload, secret, { expiresIn: '8h' });
}

export function verifyJWT(token: string): { userId: string; username: string } | null {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return null;
  }
  try {
    return jwt.verify(token, secret) as { userId: string; username: string };
  } catch (error) {
    return null;
  }
}
