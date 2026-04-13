import type { Metadata } from "next";
import { cookies } from "next/headers";
import { PreferencesProvider } from "@/components/preferences-provider";
import { ToastProvider } from "@/components/ui/Toast";
import "./globals.css";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "AbyssTracker",
  description: "Stock and Sales Management System",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Read lightweight preference cookies — no DB call needed at layout level.
  // These cookies are set by PATCH /api/preferences after each user change.
  const cookieStore = cookies();
  const rawTheme = cookieStore.get("pref_theme")?.value;
  const rawFontSize = cookieStore.get("pref_font_size")?.value;

  const initTheme: "dark" | "light" =
    rawTheme === "light" ? "light" : "dark";
  const initFontSize: "normal" | "large" =
    rawFontSize === "large" ? "large" : "normal";

  return (
    <html lang="es" className={initTheme} data-theme={initTheme} data-font-size={initFontSize}>
      <body>
        <PreferencesProvider initialTheme={initTheme} initialFontSize={initFontSize}>
          <ToastProvider>
            {children}
          </ToastProvider>
        </PreferencesProvider>
      </body>
    </html>
  );
}
