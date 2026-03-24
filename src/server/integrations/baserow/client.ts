import { Logger } from "../../shared/logger.js";
import { env } from "../../shared/env.js";
import { baserowTables } from "./tables.js";

const logger = new Logger({ integration: "baserow" });

export const BASEROW_TABLES = {
  TENANTS: baserowTables.tenants,
  SETTINGS: baserowTables.settings,
  CATEGORIES: baserowTables.categories,
  RECIPES: baserowTables.recipes,
  PAYMENTS: baserowTables.paymentOrders,
  PAYMENT_ORDERS: baserowTables.paymentOrders,
  PAYMENT_EVENTS: baserowTables.paymentEvents,
  RECIPE_PURCHASES: baserowTables.recipePurchases,
  USERS: baserowTables.users,
  COMMENTS: baserowTables.comments,
  FAVORITES: baserowTables.favorites,
  NEWSLETTER: baserowTables.newsletter,
  SHOPPING_LIST: baserowTables.shoppingList,
  RATINGS: baserowTables.ratings,
  ENTITLEMENTS: baserowTables.entitlements,
  OAUTH_STATES: baserowTables.oauthStates,
  AUDIT_LOGS: baserowTables.auditLogs,
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
  const token = env.BASEROW_API_TOKEN;
  const baseUrl = env.BASEROW_API_URL || "https://api.baserow.io";
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
          const delay = RETRY_DELAY_MS * Math.pow(2, attempt - 1);
          logger.warn(`Baserow temporary error (${res.status}). Retrying in ${delay}ms... attempt ${attempt}/${MAX_RETRIES}`, { url });
          await sleep(delay);
          continue;
        }
        logger.error(`Baserow API Error: ${res.status} ${url}`, { status: res.status, url, body: text });
        throw new Error(`Baserow Error ${res.status}: ${text}`);
      }

      if (res.status === 204) {
        return {} as T;
      }

      return await res.json() as T;
    } catch (error: any) {
      clearTimeout(timeout);
      lastError = error;
      
      const isAbort = error.name === 'AbortError';
      if (attempt < MAX_RETRIES) {
        const delay = RETRY_DELAY_MS * Math.pow(2, attempt - 1);
        logger.warn(`Baserow fetch attempt ${attempt} failed (${isAbort ? 'Timeout' : error.message}): ${url}. Retrying in ${delay}ms...`, { url });
        await sleep(delay);
        continue;
      }
    }
  }

  logger.error(`Baserow API Total Failure after ${MAX_RETRIES} attempts: ${url}`, { error: lastError, url });
  throw lastError;
}
