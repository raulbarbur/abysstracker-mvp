import { SignJWT, jwtVerify } from 'jose';

export async function generateJWT(payload: { userId: string; username: string }): Promise<string> {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET no definido");
  }
  const secretKey = new TextEncoder().encode(secret);
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('8h')
    .sign(secretKey);
}

export async function verifyJWT(token: string): Promise<{ userId: string; username: string } | null> {
  const secret = process.env.JWT_SECRET;
  if (!secret) return null;
  try {
    const secretKey = new TextEncoder().encode(secret);
    const { payload } = await jwtVerify(token, secretKey);
    return payload as unknown as { userId: string; username: string };
  } catch {
    return null;
  }
}
