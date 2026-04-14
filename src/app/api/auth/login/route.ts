import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { generateJWT } from '@/lib/auth';
import { verifyPassword } from '@/lib/passwords';
import { getUserPreferences } from '@/lib/preferences';

export const dynamic = 'force-dynamic';

const loginSchema = z.object({
  username: z.string().min(1, "El nombre de usuario es requerido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

export async function POST(request: NextRequest) {
  try {
    const bodyText = await request.text();
    if (!bodyText) {
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
    }
    const body = JSON.parse(bodyText);

    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
    }

    const { username, password } = parsed.data;
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user || !user.active) {
      await prisma.authLog.create({
        data: { username, successful: false, ip, timestamp: new Date() },
      });
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
    }

    const isValidPassword = await verifyPassword(password, user.passwordHash);

    if (!isValidPassword) {
      await prisma.authLog.create({
        data: { username, successful: false, ip, timestamp: new Date() },
      });
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
    }

    const token = await generateJWT({ userId: user.id, username: user.username });

    await prisma.authLog.create({
      data: { username, successful: true, ip, timestamp: new Date() },
    });

    const response = NextResponse.json({
      id: user.id,
      username: user.username,
      active: user.active,
      createdAt: user.createdAt,
    });

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      sameSite: 'strict',
      path: '/',
      maxAge: 28800, // 8 hours
    });

    // Set preference cookies so the root layout applies them immediately.
    // Non-critical: if this fails the login still succeeds.
    try {
      const prefs = await getUserPreferences(user.id);
      const cookieOpts = {
        httpOnly: true,
        sameSite: 'strict' as const,
        path: '/',
        maxAge: 60 * 60 * 24 * 30,
      };
      response.cookies.set('pref_theme', prefs.theme, cookieOpts);
      response.cookies.set('pref_font_size', prefs.fontSize, cookieOpts);
    } catch {
      // Preference cookies are optional — login still works without them
    }

    return response;
  } catch {
    return NextResponse.json({ error: "Ocurrió un error en el servidor" }, { status: 500 });
  }
}
