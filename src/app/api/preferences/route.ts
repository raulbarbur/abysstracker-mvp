import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ThemePreference, FontSizePreference } from "@prisma/client";
import { verifyJWT } from "@/lib/auth";
import { getUserPreferences } from "@/lib/preferences";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("auth_token")?.value;
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
    const token = req.cookies.get("auth_token")?.value;
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

    return NextResponse.json({
      theme: pref.theme,
      fontSize: pref.fontSize,
    });
  } catch (error) {
    console.error("PATCH /api/preferences error:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}


export const dynamic = 'force-dynamic';
