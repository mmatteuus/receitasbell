const KEY = "rdb_cart_v1";

function read(): string[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

function write(items: string[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("cart-update"));
}

export function getCart(): string[] {
  return read();
}

export function addToCart(id: string) {
  const items = read();
  if (!items.includes(id)) {
    items.push(id);
    write(items);
  }
}

export function removeFromCart(id: string) {
  write(read().filter((x) => x !== id));
}

export function clearCart() {
  write([]);
}

export function isInCart(id: string): boolean {
  return read().includes(id);
}

export function cartCount(): number {
  return read().length;
}
