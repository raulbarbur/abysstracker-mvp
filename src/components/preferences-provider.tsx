"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import type { ThemePreference, FontSizePreference } from "@/lib/preferences";

interface PreferencesContextType {
  theme: ThemePreference;
  fontSize: FontSizePreference;
  setTheme: (t: ThemePreference) => void;
  setFontSize: (fs: FontSizePreference) => void;
  toggleTheme: () => void;
  toggleFontSize: () => void;
  persistPreferences: (overrides?: { theme?: ThemePreference; fontSize?: FontSizePreference }) => Promise<boolean>;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export function PreferencesProvider({ 
  children,
  initialTheme,
  initialFontSize 
}: { 
  children: React.ReactNode;
  initialTheme: ThemePreference;
  initialFontSize: FontSizePreference;
}) {
  const [theme, setThemeState] = useState<ThemePreference>(initialTheme);
  const [fontSize, setFontSizeState] = useState<FontSizePreference>(initialFontSize);


  const prefCookieMaxAge = 60 * 60 * 24 * 30; // 30 days

  const setTheme = (t: ThemePreference) => {
    setThemeState(t);
    const root = document.documentElement;
    root.setAttribute("data-theme", t);
    root.className = t === 'dark' ? 'dark' : 'light';
    // Write cookie directly (instant, no fetch delay) so reload always picks up the latest value.
    document.cookie = `pref_theme=${t}; path=/; max-age=${prefCookieMaxAge}; samesite=strict`;
    fetch('/api/preferences/cookie', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ theme: t }),
    }).catch(() => {});
  };

  const setFontSize = (fs: FontSizePreference) => {
    setFontSizeState(fs);
    document.documentElement.setAttribute("data-font-size", fs);
    // Write cookie directly (instant, no fetch delay) so reload always picks up the latest value.
    document.cookie = `pref_font_size=${fs}; path=/; max-age=${prefCookieMaxAge}; samesite=strict`;
    fetch('/api/preferences/cookie', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fontSize: fs }),
    }).catch(() => {});
  };

  const persistPreferences = async (overrides?: { theme?: ThemePreference; fontSize?: FontSizePreference }) => {
    try {
      const res = await fetch('/api/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: overrides?.theme ?? theme, fontSize: overrides?.fontSize ?? fontSize })
      });
      return res.ok;
    } catch (e) {
      console.error("No se pudieron guardar las preferencias", e);
      return false;
    }
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const toggleFontSize = () => {
    setFontSize(fontSize === "normal" ? "large" : "normal");
  };

  useEffect(() => {
    // Sincronizar en cliente initialMount si hubo una des-sincronización con un storage viejo (opcion extra)
    // Pero como lo inyectamos de SSR, ya estará listo.
    const root = document.documentElement;
    root.setAttribute("data-theme", theme);
    root.setAttribute("data-font-size", fontSize);
    if (theme === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
    } else {
      root.classList.add("light");
      root.classList.remove("dark");
    }
  }, [theme, fontSize]);

  return (
    <PreferencesContext.Provider value={{ 
      theme, 
      fontSize, 
      setTheme, 
      setFontSize, 
      toggleTheme, 
      toggleFontSize,
      persistPreferences 
    }}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (context === undefined) {
    throw new Error("usePreferences must be used within a PreferencesProvider");
  }
  return context;
}
