import { useMemo, type PropsWithChildren } from "react";
import { toast } from "sonner";
import { ApiClientError } from "@/lib/api/client";
import { AppContext, type AppContextValue } from "@/contexts/app-context";
import { useAppBootstrapProvider } from "@/contexts/app-bootstrap-provider";
import { useIdentityProvider } from "@/contexts/identity-provider";
import { useThemeProvider } from "@/contexts/theme-provider";
import { useFavoritesProvider } from "@/contexts/favorites-provider";

export function AppProvider({ children }: PropsWithChildren) {
  const bootstrap = useAppBootstrapProvider();
  const identity = useIdentityProvider();
  const theme = useThemeProvider();
  const favorites = useFavoritesProvider({
    identityEmail: identity.identityEmail,
    requireIdentity: identity.requireIdentity,
    onIdentityExpired: () => identity.setIdentityEmail(null),
  });
  const {
    favoriteRecords,
    favorites: favoriteIds,
    favoritesLoading,
    refreshFavorites,
    isFavorite,
    toggleFavorite,
  } = favorites;

  const value = useMemo<AppContextValue>(() => ({
    categories: bootstrap.categories,
    categoriesLoading: bootstrap.categoriesLoading,
    refreshCategories: bootstrap.refreshCategories,
    settings: bootstrap.settings,
    settingsLoading: bootstrap.settingsLoading,
    refreshSettings: bootstrap.refreshSettings,
    identityEmail: identity.identityEmail,
    requireIdentity: identity.requireIdentity,
    updateIdentity: identity.updateIdentity,
    clearIdentity: identity.clearIdentity,
    favoriteRecords,
    favorites: favoriteIds,
    favoritesLoading,
    refreshFavorites,
    isFavorite,
    toggleFavorite: async (recipeId: string) => {
      try {
        return await toggleFavorite(recipeId);
      } catch (error) {
        if (error instanceof ApiClientError) {
          toast.error(error.message);
          return isFavorite(recipeId);
        }

        throw error;
      }
    },
    theme: theme.theme,
    toggleTheme: theme.toggleTheme,
  }), [
    bootstrap.categories,
    bootstrap.categoriesLoading,
    bootstrap.refreshCategories,
    bootstrap.settings,
    bootstrap.settingsLoading,
    bootstrap.refreshSettings,
    identity.identityEmail,
    identity.requireIdentity,
    identity.updateIdentity,
    identity.clearIdentity,
    favoriteRecords,
    favoriteIds,
    favoritesLoading,
    refreshFavorites,
    isFavorite,
    toggleFavorite,
    theme.theme,
    theme.toggleTheme,
  ]);

  return (
    <AppContext.Provider value={value}>
      {children}
      {identity.identityDialogElement}
    </AppContext.Provider>
  );
}
