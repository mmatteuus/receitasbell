import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  addFavorite,
  deleteFavorite,
  type FavoriteRecord,
  listFavorites,
} from '@/lib/api/interactions';
import { ApiClientError } from '@/lib/api/client';
import { trackEvent } from '@/lib/telemetry';
import { logger } from '@/lib/logger';

type FavoritesProviderInput = {
  identityEmail: string | null;
  requireIdentity: (
    message?: string,
    mode?: 'login-prompt' | 'email-form' | 'rating-prompt' | 'favorite-prompt'
  ) => Promise<string | null>;
  onIdentityExpired: () => void;
};

export function useFavoritesProvider({
  identityEmail,
  requireIdentity,
  onIdentityExpired,
}: FavoritesProviderInput) {
  const [favoriteRecords, setFavoriteRecords] = useState<FavoriteRecord[]>([]);
  const [favoritesLoading, setFavoritesLoading] = useState(false);

  const refreshFavorites = useCallback(async () => {
    if (!identityEmail) {
      setFavoriteRecords((current) => (current.length === 0 ? current : []));
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
        onIdentityExpired();
        return [];
      }

      logger.error('favorites', error);
      return [];
    } finally {
      setFavoritesLoading(false);
    }
  }, [identityEmail, onIdentityExpired]);

  useEffect(() => {
    if (!identityEmail) {
      setFavoriteRecords((current) => (current.length === 0 ? current : []));
      return;
    }

    void refreshFavorites();
  }, [identityEmail, refreshFavorites]);

  const favorites = useMemo(() => favoriteRecords.map((item) => item.recipeId), [favoriteRecords]);

  const isFavorite = useCallback((recipeId: string) => favorites.includes(recipeId), [favorites]);

  const toggleFavorite = useCallback(
    async (recipeId: string) => {
      const email = await requireIdentity(undefined, 'favorite-prompt');
      if (!email) {
        throw new ApiClientError(401, 'E-mail obrigatório para salvar favoritos.');
      }

      const existing = favoriteRecords.find((item) => item.recipeId === recipeId);
      if (existing) {
        await deleteFavorite(existing.recipeId);
        setFavoriteRecords((current) => current.filter((item) => item.id !== existing.id));
        trackEvent('favorites.remove', { recipeId });
        return false;
      }

      const created = await addFavorite(recipeId);
      setFavoriteRecords((current) => [created, ...current]);
      trackEvent('favorites.add', { recipeId });
      return true;
    },
    [favoriteRecords, requireIdentity]
  );

  return {
    favoriteRecords,
    favorites,
    favoritesLoading,
    refreshFavorites,
    isFavorite,
    toggleFavorite,
  };
}
