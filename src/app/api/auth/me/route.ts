import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth-middleware';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const authUser = await getAuthUser(request);
  if (!authUser) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  return NextResponse.json({ userId: authUser.userId, username: authUser.username });
}
