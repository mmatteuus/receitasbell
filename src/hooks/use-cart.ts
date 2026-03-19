import { useCallback, useSyncExternalStore } from "react";
import type { CartItem } from "@/types/recipe";
import { cartRepo } from "@/lib/repos/cartRepo";
import { trackEvent } from "@/lib/telemetry";

export function useCart() {
  const items = useSyncExternalStore(cartRepo.subscribe, cartRepo.list, cartRepo.list);

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

  const has = useCallback((recipeId: string) => cartRepo.has(recipeId), []);
  const getTotal = useCallback(() => cartRepo.getTotal(), []);

  return { items, add, remove, clear, has, count: items.length, getTotal };
}
