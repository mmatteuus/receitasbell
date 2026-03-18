import type { CartItem } from "@/types/recipe";
import { sumBRL } from "@/lib/utils/money";

const KEY = "rdb_cart_v2";

function read(): CartItem[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || "[]");
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (item): item is CartItem =>
        item &&
        typeof item === "object" &&
        typeof item.recipeId === "string" &&
        typeof item.title === "string" &&
        typeof item.slug === "string" &&
        typeof item.priceBRL === "number" &&
        typeof item.imageUrl === "string",
    );
  } catch {
    return [];
  }
}

function write(items: CartItem[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("cart-update"));
}

export function getCart(): CartItem[] {
  return read();
}

export function addToCart(item: CartItem) {
  const items = read();
  if (!items.some((current) => current.recipeId === item.recipeId)) {
    items.push(item);
    write(items);
  }
}

export function removeFromCart(recipeId: string) {
  write(read().filter((item) => item.recipeId !== recipeId));
}

export function clearCart() {
  write([]);
}

export function listCartItems() {
  return read();
}

export function isInCart(recipeId: string): boolean {
  return read().some((item) => item.recipeId === recipeId);
}

export function cartCount(): number {
  return read().length;
}

export function getCartTotal() {
  return sumBRL(read().map((item) => item.priceBRL));
}
