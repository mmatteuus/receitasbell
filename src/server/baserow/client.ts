// Constantes removidas do topo para leitura em tempo de execuo

export const BASEROW_TABLES = {
  TENANTS: 896975,
  SETTINGS: 896976,
  CATEGORIES: 896977,
  RECIPES: 896978,
  PAYMENTS: 896979,
  USERS: 896984,
  COMMENTS: 896987,
  FAVORITES: 896988,
  NEWSLETTER: 896989,
  SHOPPING_LIST: 896990,
  RATINGS: 896991,
  ENTITLEMENTS: 896992,
  OAUTH_STATES: 896993,
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
