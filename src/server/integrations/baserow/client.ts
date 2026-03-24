import { env } from '../../shared/env.js';

export class BaserowError extends Error {
  constructor(public status: number, message: string, public payload?: unknown) {
    super(message);
    this.name = 'BaserowError';
  }
}

/**
 * Standardized Baserow Fetch Client with timeout and error handling.
 */
export async function fetchBaserow<T>(path: string, init: RequestInit = {}): Promise<T> {
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
      // Not JSON
    }

    if (!res.ok) throw new BaserowError(res.status, `Baserow HTTP ${res.status}`, data);
    return data as T;
  } finally {
    clearTimeout(timeout);
  }
}

// Alias para depreciação controlada
export const baserowFetch = fetchBaserow;
