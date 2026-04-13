import { prisma } from "./prisma";

export type ThemePreference = "dark" | "light";
export type FontSizePreference = "normal" | "large";

export interface UserPreferences {
  theme: ThemePreference;
  fontSize: FontSizePreference;
}

export async function getUserPreferences(userId: string): Promise<UserPreferences> {
  try {
    const pref = await prisma.userPreference.findUnique({
      where: { userId },
    });
    
    return {
      theme: (pref?.theme as ThemePreference) || "dark",
      fontSize: (pref?.fontSize as FontSizePreference) || "normal",
    };
  } catch (error) {
    console.error("Error fetching user preferences:", error);
    return { theme: "dark", fontSize: "normal" };
  }
}
