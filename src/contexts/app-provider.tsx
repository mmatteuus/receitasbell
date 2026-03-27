import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import { toast } from "sonner";
import { DEFAULT_CATEGORIES, DEFAULT_HOME_SETTINGS, DEFAULT_PAYMENT_SETTINGS, DEFAULT_SITE_SETTINGS } from "@/lib/defaults";
import { addFavorite, deleteFavorite, type FavoriteRecord, listFavorites } from "@/lib/api/interactions";
import { getSettings } from "@/lib/api/settings";
import { ApiClientError } from "@/lib/api/client";
import { isValidEmail, fetchMe } from "@/lib/api/identity";
import { applySiteSettings } from "@/lib/theme";
import type { Category } from "@/types/category";
import type { SettingsMap } from "@/types/settings";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { trackEvent } from "@/lib/telemetry";
import { logger } from "@/lib/logger";
import { getCategories } from "@/lib/repos/categoryRepo";
import { AppContext, type AppContextValue } from "@/contexts/app-context";

type IdentityDialogState = {
  open: boolean;
  message: string;
  email: string;
  error: string;
};

const defaultSettings: SettingsMap = {
  ...DEFAULT_SITE_SETTINGS,
  ...DEFAULT_HOME_SETTINGS,
  ...DEFAULT_PAYMENT_SETTINGS,
};

export function AppProvider({ children }: PropsWithChildren) {
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [settings, setSettings] = useState<SettingsMap>(defaultSettings);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [identityEmail, setIdentityEmailState] = useState<string | null>(null);
  const [identityDialog, setIdentityDialog] = useState<IdentityDialogState>({
    open: false,
    message: "",
    email: "",
    error: "",
  });
  const [identityLoading, setIdentityLoading] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "light";
    const stored = window.localStorage.getItem("rb_theme");
    if (stored === "dark" || stored === "light") return stored;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });
  const [identityResolver, setIdentityResolver] = useState<((value: string | null) => void) | null>(null);
  const [favoriteRecords, setFavoriteRecords] = useState<FavoriteRecord[]>([]);
  const [favoritesLoading, setFavoritesLoading] = useState(false);

  const refreshCategories = useCallback(async () => {
    setCategoriesLoading(true);
    try {
      const next = await getCategories();
      setCategories(next);
      return next;
    } catch (error) {
      logger.error("categories", error);
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
      logger.error("settings", error);
      return defaultSettings;
    } finally {
      setSettingsLoading(false);
    }
  }, []);

  const refreshFavorites = useCallback(async () => {
    if (!identityEmail) {
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
        setIdentityEmailState(null);
        return [];
      }
      logger.error("favorites", error);
      return [];
    } finally {
      setFavoritesLoading(false);
    }
  }, [identityEmail]);

  const requireIdentity = useCallback(async (message?: string) => {
    if (identityEmail) {
      return identityEmail;
    }

    const email = await new Promise<string | null>((resolve) => {
      setIdentityResolver(() => resolve);
      setIdentityDialog({
        open: true,
        message: message || "Informe seu e-mail para salvar favoritos, compras e receitas desbloqueadas.",
        email: "",
        error: "",
      });
    });

    setIdentityEmailState(email);
    if (email) {
      void refreshFavorites();
    }
    return email;
  }, [identityEmail, refreshFavorites]);

  const updateIdentity = useCallback(async (email: string) => {
    const normalized = email.trim().toLowerCase();
    if (!isValidEmail(normalized)) {
      throw new ApiClientError(400, "Informe um e-mail válido.");
    }
    // No longer setting local cookie here.
  }, []);

  const clearIdentity = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      setIdentityEmailState(null);
      setFavoriteRecords([]);
      toast.success("Sessão encerrada.");
    }
  }, []);

  const toggleFavorite = useCallback(async (recipeId: string) => {
    const email = await requireIdentity("Digite seu e-mail para salvar favoritos.");
    if (!email) {
      throw new ApiClientError(401, "E-mail obrigatório para salvar favoritos.");
    }

    const existing = favoriteRecords.find((item) => item.recipeId === recipeId);
    if (existing) {
      await deleteFavorite(existing.recipeId);
      setFavoriteRecords((current) => current.filter((item) => item.id !== existing.id));
      trackEvent("favorites.remove", { recipeId });
      return false;
    }

    const created = await addFavorite(recipeId);
    setFavoriteRecords((current) => [created, ...current]);
    trackEvent("favorites.add", { recipeId });
    return true;
  }, [favoriteRecords, requireIdentity]);

  const toggleTheme = useCallback(() => {
    setTheme((current) => {
      const next = current === "light" ? "dark" : "light";
      trackEvent("theme.toggle", { theme: next });
      return next;
    });
  }, []);

  useEffect(() => {
    void refreshCategories();
    void refreshSettings();

    // Check session on mount
    void fetchMe().then(user => {
      if (user?.email) {
        setIdentityEmailState(user.email);
      }
    });
  }, [refreshCategories, refreshSettings]);

  useEffect(() => {
    applySiteSettings(settings);
  }, [settings]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    document.documentElement.classList.toggle("dark", theme === "dark");
    window.localStorage.setItem("rb_theme", theme);
  }, [theme]);

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
    updateIdentity,
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
    theme,
    toggleTheme,
  }), [
    categories,
    categoriesLoading,
    refreshCategories,
    settings,
    settingsLoading,
    refreshSettings,
    identityEmail,
    requireIdentity,
    updateIdentity,
    clearIdentity,
    favoriteRecords,
    favorites,
    favoritesLoading,
    refreshFavorites,
    toggleFavorite,
    theme,
    toggleTheme,
  ]);

  async function handleIdentityConfirm() {
    const normalized = identityDialog.email.trim().toLowerCase();
    if (!isValidEmail(normalized)) {
      setIdentityDialog((current) => ({
        ...current,
        error: "Digite um e-mail válido para continuar.",
      }));
      return;
    }

    setIdentityLoading(true);
    try {
      const res = await fetch("/api/auth/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalized }),
      });

      if (!res.ok) throw new Error("Falha ao solicitar login");

      setIdentityDialog((current) => ({ ...current, open: false, error: "" }));
      toast.success("Enviamos um link de confirmação para seu e-mail.");

      // We don't resolve the promise with email yet because they need to click the link.
      identityResolver?.(null);
    } catch {
      setIdentityDialog((current) => ({ ...current, error: "Ocorreu um erro ao enviar o link." }));
    } finally {
      setIdentityResolver(null);
      setIdentityLoading(false);
    }
  }

  function handleIdentityCancel() {
    setIdentityDialog((current) => ({ ...current, open: false, error: "" }));
    identityResolver?.(null);
    setIdentityResolver(null);
    setIdentityLoading(false);
  }

  return (
    <AppContext.Provider value={value}>
      {children}
      <Dialog open={identityDialog.open} onOpenChange={(open) => !open && handleIdentityCancel()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Identifique-se para continuar</DialogTitle>
            <DialogDescription>
              {identityDialog.message}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Input
              type="email"
              placeholder="voce@email.com"
              value={identityDialog.email}
              onChange={(event) => setIdentityDialog((current) => ({ ...current, email: event.target.value, error: "" }))}
              autoFocus
            />
            {identityDialog.error && <p className="text-sm text-destructive">{identityDialog.error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleIdentityCancel} disabled={identityLoading}>
              Agora não
            </Button>
            <Button onClick={() => void handleIdentityConfirm()} disabled={identityLoading}>
              {identityLoading ? "Salvando..." : "Continuar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppContext.Provider>
  );
}
