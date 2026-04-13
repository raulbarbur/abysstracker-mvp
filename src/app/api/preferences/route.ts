import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ThemePreference, FontSizePreference } from "@prisma/client";
import { verifyJWT } from "@/lib/auth";
import { getUserPreferences } from "@/lib/preferences";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("auth-token")?.value;
    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const payload = await verifyJWT(token);
    if (!payload) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    const preferences = await getUserPreferences(payload.userId);
    return NextResponse.json(preferences);
  } catch (error) {
    console.error("GET /api/preferences error:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const token = req.cookies.get("auth-token")?.value;
    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const payload = await verifyJWT(token);
    if (!payload) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    const { theme, fontSize } = await req.json();

    const updateData: { theme?: ThemePreference; fontSize?: FontSizePreference } = {};
    if (theme && ["dark", "light"].includes(theme)) {
      updateData.theme = theme as ThemePreference;
    }
    if (fontSize && ["normal", "large"].includes(fontSize)) {
      updateData.fontSize = fontSize as FontSizePreference;
    }

    const pref = await prisma.userPreference.upsert({
      where: { userId: payload.userId },
      update: updateData,
      create: {
        userId: payload.userId,
        ...updateData,
      },
    });

    const response = NextResponse.json({
      theme: pref.theme,
      fontSize: pref.fontSize,
    });

    // Set lightweight cookies so the root layout can read preferences
    // without needing a Prisma/DB call at render time.
    const cookieOpts = {
      path: "/",
      httpOnly: true,
      sameSite: "strict" as const,
      maxAge: 60 * 60 * 24 * 30, // 30 days
    };
    response.cookies.set("pref_theme", pref.theme, cookieOpts);
    response.cookies.set("pref_font_size", pref.fontSize, cookieOpts);

    return response;
  } catch (error) {
    console.error("PATCH /api/preferences error:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
