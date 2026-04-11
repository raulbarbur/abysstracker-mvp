import { NextRequest } from 'next/server';
import { verifyJWT } from '@/lib/auth';

export async function getAuthUser(request: NextRequest): Promise<{ userId: string; username: string } | null> {
  const token = request.cookies.get('auth-token')?.value;
  
  if (!token) {
    return null;
  }
  
  return verifyJWT(token);
}
