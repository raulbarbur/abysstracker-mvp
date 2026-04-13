import type { Metadata } from "next";
import { cookies } from "next/headers";
import { verifyJWT } from "@/lib/auth";
import { getUserPreferences } from "@/lib/preferences";
import { PreferencesProvider } from "@/components/preferences-provider";
import { ToastProvider } from "@/components/ui/Toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "AbyssTracker",
  description: "Stock and Sales Management System",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // SSR Hydration
  const cookieStore = cookies();
  const token = cookieStore.get("auth_token")?.value;
  
  let initTheme: "dark" | "light" = "dark";
  let initFontSize: "normal" | "large" = "normal";

  if (token) {
    const payload = await verifyJWT(token);
    if (payload) {
      const prefs = await getUserPreferences(payload.userId);
      initTheme = prefs.theme;
      initFontSize = prefs.fontSize;
    }
  }

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
