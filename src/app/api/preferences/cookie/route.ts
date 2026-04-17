import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

const cookieOpts = {
  path: "/",
  httpOnly: false, // non-sensitive preference data; must be false so client can also write via document.cookie
  sameSite: "strict" as const,
  maxAge: 60 * 60 * 24 * 30, // 30 days
};

// Public endpoint — no auth required.
// Only writes lightweight preference cookies (theme / font-size).
// Used by unauthenticated pages (e.g. login) so toggles persist across reloads.
export async function POST(req: NextRequest) {
  try {
    const { theme, fontSize } = await req.json();
    const response = NextResponse.json({ ok: true });

    if (theme && ["dark", "light"].includes(theme)) {
      response.cookies.set("pref_theme", theme, cookieOpts);
    }
    if (fontSize && ["normal", "large"].includes(fontSize)) {
      response.cookies.set("pref_font_size", fontSize, cookieOpts);
    }

    return response;
  } catch {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
