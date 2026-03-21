import type { CartItem } from "@/types/cart";
import { sumBRL } from "@/lib/utils/money";

const KEY = "rdb_cart_v2";
export const CART_UPDATED_EVENT = "cart:update";
let cachedRaw = "[]";
let cachedItems: CartItem[] = [];

function canUseStorage() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function read(): CartItem[] {
  if (!canUseStorage()) {
    return [];
  }

  try {
    const raw = localStorage.getItem(KEY) || "[]";
    if (raw === cachedRaw) {
      return cachedItems;
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      cachedRaw = "[]";
      cachedItems = [];
      return [];
    }

    cachedItems = parsed.filter(
      (item): item is CartItem =>
        item &&
        typeof item === "object" &&
        typeof item.recipeId === "string" &&
        typeof item.title === "string" &&
        typeof item.slug === "string" &&
        typeof item.priceBRL === "number" &&
        typeof item.quantity === "number" &&
        (typeof item.imageUrl === "string" || item.imageUrl === null),
    );
    cachedRaw = raw;
    return cachedItems;
  } catch {
    cachedRaw = "[]";
    cachedItems = [];
    return [];
  }
}

function write(items: CartItem[]) {
  if (!canUseStorage()) {
    return;
  }

  const raw = JSON.stringify(items);
  cachedRaw = raw;
  cachedItems = items;
  localStorage.setItem(KEY, raw);
  window.dispatchEvent(new Event(CART_UPDATED_EVENT));
}

function subscribe(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  window.addEventListener(CART_UPDATED_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);

  return () => {
    window.removeEventListener(CART_UPDATED_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

function list() {
  return read();
}

function add(item: CartItem) {
  const items = read();
  const existing = items.find((current) => current.recipeId === item.recipeId);
  if (existing) {
    existing.quantity = (existing.quantity || 1) + (item.quantity || 1);
  } else {
    items.push({ ...item, quantity: item.quantity || 1 });
  }
  write(items);
}

function updateQuantity(recipeId: string, delta: number) {
  const items = read();
  const item = items.find((i) => i.recipeId === recipeId);
  if (item) {
    item.quantity = Math.max(1, (item.quantity || 1) + delta);
    write(items);
  }
}

function remove(recipeId: string) {
  write(read().filter((item) => item.recipeId !== recipeId));
}

function clear() {
  write([]);
}

function has(recipeId: string) {
  return read().some((item) => item.recipeId === recipeId);
}

function count() {
  return read().length;
}

function getTotal() {
  return sumBRL(read().map((item) => item.priceBRL * (item.quantity || 1)));
}

export const cartRepo = {
  subscribe,
  list,
  add,
  remove,
  clear,
  has,
  count,
  getTotal,
  updateQuantity,
};

export function listCartItems() {
  return cartRepo.list();
}

export function getCart(): CartItem[] {
  return cartRepo.list();
}

export function addToCart(item: CartItem) {
  cartRepo.add(item);
}

export function removeFromCart(recipeId: string) {
  cartRepo.remove(recipeId);
}

export function clearCart() {
  cartRepo.clear();
}

export function isInCart(recipeId: string): boolean {
  return cartRepo.has(recipeId);
}

export function cartCount(): number {
  return cartRepo.count();
}

export function getCartTotal() {
  return cartRepo.getTotal();
}
