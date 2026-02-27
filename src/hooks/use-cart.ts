import { useState, useEffect, useCallback } from "react";
import { getCart, addToCart, removeFromCart, clearCart } from "@/lib/repos/cartRepo";

export function useCart() {
  const [items, setItems] = useState<string[]>(getCart);

  useEffect(() => {
    const sync = () => setItems(getCart());
    window.addEventListener("cart-update", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("cart-update", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const add = useCallback((id: string) => { addToCart(id); setItems(getCart()); }, []);
  const remove = useCallback((id: string) => { removeFromCart(id); setItems(getCart()); }, []);
  const clear = useCallback(() => { clearCart(); setItems([]); }, []);
  const has = useCallback((id: string) => items.includes(id), [items]);

  return { items, add, remove, clear, has, count: items.length };
}
