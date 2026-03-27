import { createContext, useContext } from "react";
import type { Category } from "@/types/category";
import type { SettingsMap } from "@/types/settings";
import type { FavoriteRecord } from "@/lib/api/interactions";

export type AppContextValue = {
  categories: Category[];
  categoriesLoading: boolean;
  refreshCategories: () => Promise<Category[]>;
  settings: SettingsMap;
  settingsLoading: boolean;
  refreshSettings: () => Promise<SettingsMap>;
  identityEmail: string | null;
  requireIdentity: (message?: string) => Promise<string | null>;
  updateIdentity: (email: string) => Promise<void>;
  clearIdentity: () => void;
  favoriteRecords: FavoriteRecord[];
  favorites: string[];
  favoritesLoading: boolean;
  refreshFavorites: () => Promise<FavoriteRecord[]>;
  isFavorite: (recipeId: string) => boolean;
  toggleFavorite: (recipeId: string) => Promise<boolean>;
  theme: "light" | "dark";
  toggleTheme: () => void;
};

export const AppContext = createContext<AppContextValue | null>(null);

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within AppProvider");
  }
  return context;
}
