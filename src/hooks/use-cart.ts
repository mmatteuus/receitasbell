import { useCallback, useMemo, useSyncExternalStore } from "react";
import type { CartItem } from "@/types/cart";
import { cartRepo } from "@/lib/repos/cartRepo";
import { trackEvent } from "@/lib/telemetry";

export function useCart() {
  const snapshot = useSyncExternalStore(cartRepo.subscribe, cartRepo.snapshot, cartRepo.snapshot);
  const items = useMemo(() => snapshot.map((item) => ({ ...item })), [snapshot]);

  const add = useCallback((item: CartItem) => {
    cartRepo.add(item);
    trackEvent("cart.add", { recipeId: item.recipeId });
  }, []);

  const remove = useCallback((recipeId: string) => {
    cartRepo.remove(recipeId);
    trackEvent("cart.remove", { recipeId });
  }, []);

  const clear = useCallback(() => {
    cartRepo.clear();
    trackEvent("cart.clear");
  }, []);

  const updateQuantity = useCallback((recipeId: string, delta: number) => {
    cartRepo.updateQuantity(recipeId, delta);
    trackEvent("cart.update_quantity", { recipeId, delta });
  }, []);

  const has = useCallback((recipeId: string) => cartRepo.has(recipeId), []);
  const getTotal = useCallback(() => cartRepo.getTotal(), []);

  return { items, add, remove, clear, updateQuantity, has, count: items.length, getTotal };
}
