// Constantes removidas do topo para leitura em tempo de execuo

export const BASEROW_TABLES = {
  TENANTS: Number(process.env.BASEROW_TABLE_TENANTS),
  SETTINGS: Number(process.env.BASEROW_TABLE_SETTINGS || 896976),
  CATEGORIES: Number(process.env.BASEROW_TABLE_CATEGORIES || 896977),
  RECIPES: Number(process.env.BASEROW_TABLE_RECIPES || 896978),
  PAYMENTS: Number(process.env.BASEROW_TABLE_PAYMENTS || 896979),
  PAYMENT_ORDERS: Number(process.env.BASEROW_TABLE_PAYMENT_ORDERS || 896979),
  PAYMENT_EVENTS: Number(process.env.BASEROW_TABLE_PAYMENT_EVENTS || 896994),
  RECIPE_PURCHASES: Number(process.env.BASEROW_TABLE_RECIPE_PURCHASES || 896995),
  USERS: Number(process.env.BASEROW_TABLE_USERS || 896984),
  COMMENTS: Number(process.env.BASEROW_TABLE_COMMENTS || 896987),
  FAVORITES: Number(process.env.BASEROW_TABLE_FAVORITES || 896988),
  NEWSLETTER: Number(process.env.BASEROW_TABLE_NEWSLETTER || 896989),
  SHOPPING_LIST: Number(process.env.BASEROW_TABLE_SHOPPING_LIST || 896990),
  RATINGS: Number(process.env.BASEROW_TABLE_RATINGS || 896991),
  ENTITLEMENTS: Number(process.env.BASEROW_TABLE_ENTITLEMENTS || 896992),
  OAUTH_STATES: Number(process.env.BASEROW_TABLE_OAUTH_STATES || 896993),
  AUDIT_LOGS: Number(process.env.BASEROW_TABLE_AUDIT_LOGS || 896996),
};

export async function fetchBaserow<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = process.env.BASEROW_API_TOKEN;
  const baseUrl = process.env.BASEROW_API_URL || "https://api.baserow.io";
  const url = `${baseUrl}${endpoint}`;
  
  const headers = new Headers(options.headers || {});
  headers.set("Authorization", `Token ${token}`);
  
  if (options.method && options.method !== "GET" && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`Baserow API Error: ${res.status} ${url} - ${text}`);
    throw new Error(`Baserow Error ${res.status}: ${text}`);
  }

  if (res.status === 204) {
    return {} as T;
  }

  return res.json() as Promise<T>;
}
