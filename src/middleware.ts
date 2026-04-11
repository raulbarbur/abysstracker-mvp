import { NextRequest, NextResponse } from 'next/server'
import { verifyJWT } from '@/lib/auth'

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value
  
  // Note: middleware running next.js edge uses jsonwebtoken bypass or native web crypto (jose).
  // Assuming verifyJWT handles the token securely without crashing.
  try {
    if (!token || !(await verifyJWT(token))) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }
  } catch {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: ['/api/((?!auth/login).*)']
}
