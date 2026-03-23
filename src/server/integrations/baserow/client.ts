import { logger } from "../../domains/observability/logger.js";

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

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;
const TIMEOUT_MS = 10000;

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

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

  let lastError: any;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const res = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!res.ok) {
        const text = await res.text();
        if (attempt < MAX_RETRIES && (res.status >= 500 || res.status === 429)) {
          logger.warn(`Baserow temporary error (${res.status}). Retrying... attempt ${attempt}/${MAX_RETRIES}`);
          await sleep(RETRY_DELAY_MS * attempt);
          continue;
        }
        logger.error(`Baserow API Error: ${res.status} ${url}`, { status: res.status, url, body: text });
        throw new Error(`Baserow Error ${res.status}: ${text}`);
      }

      if (res.status === 204) {
        return {} as T;
      }

      return await res.json() as T;
    } catch (error) {
      clearTimeout(timeout);
      lastError = error;
      
      if (attempt < MAX_RETRIES) {
        logger.warn(`Baserow fetch attempt ${attempt} failed: ${url}`, error);
        await sleep(RETRY_DELAY_MS * attempt);
        continue;
      }
    }
  }

  logger.error(`Baserow API Total Failure after ${MAX_RETRIES} attempts: ${url}`, lastError);
  throw lastError;
}
