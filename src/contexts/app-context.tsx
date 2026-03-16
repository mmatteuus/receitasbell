import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import { toast } from "sonner";
import { DEFAULT_CATEGORIES, DEFAULT_HOME_SETTINGS, DEFAULT_PAYMENT_SETTINGS, DEFAULT_SITE_SETTINGS } from "@/lib/defaults";
import { addFavorite, deleteFavorite, type FavoriteRecord, listFavorites } from "@/lib/api/interactions";
import { listCategories } from "@/lib/api/categories";
import { getSettings } from "@/lib/api/settings";
import { ApiClientError } from "@/lib/api/client";
import {
  clearIdentityEmail,
  ensureIdentityEmail,
  getIdentityEmail,
} from "@/lib/api/identity";
import { applySiteSettings } from "@/lib/theme";
import type { Category } from "@/types/recipe";
import type { SettingsMap } from "@/types/settings";

type AppContextValue = {
  categories: Category[];
  categoriesLoading: boolean;
  refreshCategories: () => Promise<Category[]>;
  settings: SettingsMap;
  settingsLoading: boolean;
  refreshSettings: () => Promise<SettingsMap>;
  identityEmail: string | null;
  requireIdentity: (message?: string) => Promise<string | null>;
  clearIdentity: () => void;
  favoriteRecords: FavoriteRecord[];
  favorites: string[];
  favoritesLoading: boolean;
  refreshFavorites: () => Promise<FavoriteRecord[]>;
  isFavorite: (recipeId: string) => boolean;
  toggleFavorite: (recipeId: string) => Promise<boolean>;
};

const defaultSettings: SettingsMap = {
  ...DEFAULT_SITE_SETTINGS,
  ...DEFAULT_HOME_SETTINGS,
  ...DEFAULT_PAYMENT_SETTINGS,
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: PropsWithChildren) {
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [settings, setSettings] = useState<SettingsMap>(defaultSettings);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [identityEmail, setIdentityEmailState] = useState<string | null>(() => getIdentityEmail());
  const [favoriteRecords, setFavoriteRecords] = useState<FavoriteRecord[]>([]);
  const [favoritesLoading, setFavoritesLoading] = useState(false);

  const refreshCategories = useCallback(async () => {
    setCategoriesLoading(true);
    try {
      const next = await listCategories();
      setCategories(next);
      return next;
    } catch (error) {
      console.error("Failed to load categories", error);
      return DEFAULT_CATEGORIES;
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  const refreshSettings = useCallback(async () => {
    setSettingsLoading(true);
    try {
      const next = await getSettings();
      setSettings(next);
      return next;
    } catch (error) {
      console.error("Failed to load settings", error);
      return defaultSettings;
    } finally {
      setSettingsLoading(false);
    }
  }, []);

  const refreshFavorites = useCallback(async () => {
    const email = getIdentityEmail();
    setIdentityEmailState(email);
    if (!email) {
      setFavoriteRecords([]);
      return [];
    }

    setFavoritesLoading(true);
    try {
      const next = await listFavorites();
      setFavoriteRecords(next);
      return next;
    } catch (error) {
      if (error instanceof ApiClientError && error.status === 401) {
        setFavoriteRecords([]);
        return [];
      }
      console.error("Failed to load favorites", error);
      return [];
    } finally {
      setFavoritesLoading(false);
    }
  }, []);

  const requireIdentity = useCallback(async (message?: string) => {
    const email = await ensureIdentityEmail(message);
    setIdentityEmailState(email);
    if (email) {
      void refreshFavorites();
    }
    return email;
  }, [refreshFavorites]);

  const clearIdentity = useCallback(() => {
    clearIdentityEmail();
    setIdentityEmailState(null);
    setFavoriteRecords([]);
  }, []);

  const toggleFavorite = useCallback(async (recipeId: string) => {
    const email = await requireIdentity("Digite seu e-mail para salvar favoritos.");
    if (!email) {
      throw new ApiClientError(401, "E-mail obrigatorio para salvar favoritos.");
    }

    const existing = favoriteRecords.find((item) => item.recipeId === recipeId);
    if (existing) {
      await deleteFavorite(existing.id);
      setFavoriteRecords((current) => current.filter((item) => item.id !== existing.id));
      return false;
    }

    const created = await addFavorite(recipeId);
    setFavoriteRecords((current) => [created, ...current]);
    return true;
  }, [favoriteRecords, requireIdentity]);

  useEffect(() => {
    void refreshCategories();
    void refreshSettings();
  }, [refreshCategories, refreshSettings]);

  useEffect(() => {
    applySiteSettings(settings);
  }, [settings]);

  useEffect(() => {
    if (!identityEmail) return;
    void refreshFavorites();
  }, [identityEmail, refreshFavorites]);

  const favorites = useMemo(
    () => favoriteRecords.map((item) => item.recipeId),
    [favoriteRecords],
  );

  const value = useMemo<AppContextValue>(() => ({
    categories,
    categoriesLoading,
    refreshCategories,
    settings,
    settingsLoading,
    refreshSettings,
    identityEmail,
    requireIdentity,
    clearIdentity,
    favoriteRecords,
    favorites,
    favoritesLoading,
    refreshFavorites,
    isFavorite: (recipeId: string) => favorites.includes(recipeId),
    toggleFavorite: async (recipeId: string) => {
      try {
        return await toggleFavorite(recipeId);
      } catch (error) {
        if (error instanceof ApiClientError) {
          toast.error(error.message);
          return favorites.includes(recipeId);
        }
        throw error;
      }
    },
  }), [
    categories,
    categoriesLoading,
    refreshCategories,
    settings,
    settingsLoading,
    refreshSettings,
    identityEmail,
    requireIdentity,
    clearIdentity,
    favoriteRecords,
    favorites,
    favoritesLoading,
    refreshFavorites,
    toggleFavorite,
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within AppProvider");
  }
  return context;
}
