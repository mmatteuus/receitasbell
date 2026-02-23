"use client";

import { useState, useEffect } from 'react';

const STORAGE_KEY = 'receitas_bell_purchased';

export function useDemoPurchase() {
  const [purchasedIds, setPurchasedIds] = useState<string[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setPurchasedIds(JSON.parse(stored));
      } catch (e) {
        setPurchasedIds([]);
      }
    }
  }, []);

  const unlockRecipe = (id: string) => {
    const updated = [...purchasedIds, id];
    setPurchasedIds(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const isUnlocked = (recipeId: string, tier: 'free' | 'paid') => {
    if (tier === 'free') return true;
    return purchasedIds.includes(recipeId);
  };

  return { purchasedIds, unlockRecipe, isUnlocked };
}