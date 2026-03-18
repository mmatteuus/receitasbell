import { useState, useEffect, useCallback } from "react";
import type { CartItem } from "@/types/recipe";
import { addToCart, clearCart, getCart, listCartItems, removeFromCart } from "@/lib/repos/cartRepo";
import { trackEvent } from "@/lib/telemetry";

export function useCart() {
  const [items, setItems] = useState<CartItem[]>(getCart);

  useEffect(() => {
    const sync = () => setItems(listCartItems());
    window.addEventListener("cart-update", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("cart-update", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const add = useCallback((item: CartItem) => {
    addToCart(item);
    setItems(getCart());
    trackEvent("cart.add", { recipeId: item.recipeId });
  }, []);
  const remove = useCallback((recipeId: string) => {
    removeFromCart(recipeId);
    setItems(getCart());
    trackEvent("cart.remove", { recipeId });
  }, []);
  const clear = useCallback(() => {
    clearCart();
    setItems([]);
    trackEvent("cart.clear");
  }, []);
  const has = (recipeId: string) => items.some((item) => item.recipeId === recipeId);
  const getTotal = () => items.reduce((sum, item) => sum + item.priceBRL, 0);

  return { items, add, remove, clear, has, count: items.length, getTotal };
}
