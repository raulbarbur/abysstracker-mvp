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
  persistPreferences: () => Promise<boolean>;
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


  const setTheme = (t: ThemePreference) => {
    setThemeState(t);
    const root = document.documentElement;
    root.setAttribute("data-theme", t);
    root.className = t === 'dark' ? 'dark' : 'light';
  };

  const setFontSize = (fs: FontSizePreference) => {
    setFontSizeState(fs);
    document.documentElement.setAttribute("data-font-size", fs);
  };

  const persistPreferences = async () => {
    try {
      const res = await fetch('/api/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme, fontSize })
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
