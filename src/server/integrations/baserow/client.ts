import { env } from '../../shared/env.js';

export class BaserowError extends Error {
  constructor(public status: number, message: string, public payload?: unknown) {
    super(message);
  }
}

export async function baserowFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const url = `${env.BASEROW_API_URL.replace(/\/$/, '')}${path}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        'Authorization': `Token ${env.BASEROW_API_TOKEN}`,
        'Content-Type': 'application/json',
        ...(init.headers ?? {}),
      },
    });

    const text = await res.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch (e) {
      // If not JSON, return text or null
    }

    if (!res.ok) throw new BaserowError(res.status, `Baserow HTTP ${res.status}`, data);
    return data as T;
  } finally {
    clearTimeout(timeout);
  }
}

export const BASEROW_TABLES = {
  TENANTS: env.BASEROW_TABLE_TENANTS,
  USERS: env.BASEROW_TABLE_USERS,
  USER_SESSIONS: env.BASEROW_TABLE_USER_SESSIONS,
  AUTH_TOKENS: env.BASEROW_TABLE_AUTH_TOKENS,
  RECIPES: env.BASEROW_TABLE_RECIPES,
  CATEGORIES: env.BASEROW_TABLE_CATEGORIES,
  SETTINGS: env.BASEROW_TABLE_SETTINGS,
  COMMENTS: env.BASEROW_TABLE_COMMENTS,
  RATINGS: env.BASEROW_TABLE_RATINGS,
  FAVORITES: env.BASEROW_TABLE_FAVORITES,
  SHOPPING_LIST: env.BASEROW_TABLE_SHOPPING_LIST,
  NEWSLETTER: env.BASEROW_TABLE_NEWSLETTER,
  TENANT_USERS: env.BASEROW_TABLE_TENANT_USERS,
  ENTITLEMENTS: env.BASEROW_TABLE_ENTITLEMENTS,
  OAUTH_STATES: env.BASEROW_TABLE_OAUTH_STATES,
  PAYMENTS: env.BASEROW_TABLE_PAYMENT_ORDERS,
  PAYMENT_EVENTS: env.BASEROW_TABLE_PAYMENT_EVENTS,
  RECIPE_PURCHASES: env.BASEROW_TABLE_RECIPE_PURCHASES,
  AUDIT_LOGS: env.BASEROW_TABLE_AUDIT_LOGS,
} as const;
