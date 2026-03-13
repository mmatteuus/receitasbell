"use client";

import { useAppContext } from "@/contexts/app-context";

export function useFavorites() {
  const {
    favorites,
    favoritesLoading,
    isFavorite,
    refreshFavorites,
    toggleFavorite,
  } = useAppContext();

  return {
    favorites,
    loading: favoritesLoading,
    refreshFavorites,
    isFavorite,
    toggleFavorite,
  };
}
