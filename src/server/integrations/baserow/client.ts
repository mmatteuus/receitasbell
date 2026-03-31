import { env } from '../../shared/env.js';

type BaserowFetchOptions = {
  endpoint?: string;
  idempotent?: boolean;
  retries?: number;
  timeoutMs?: number;
};

const DEFAULT_BASEROW_URL = 'https://api.baserow.io';
const DEFAULT_TIMEOUT_MS = Number(env.BASEROW_TIMEOUT_MS ?? '15000');
const DEFAULT_RETRIES = 2;

export class BaserowError extends Error {
  status: number;
  body?: unknown;
  endpoint?: string;

  constructor(status: number, message: string, body?: unknown, endpoint?: string) {
    super(message);
    this.name = 'BaserowError';
    this.status = status;
    this.body = body;
    this.endpoint = endpoint;
  }
}

export const BASEROW_TABLES = {
  TENANTS: env.BASEROW_TABLE_TENANTS ?? '',
  USERS: env.BASEROW_TABLE_USERS ?? '',
  TENANT_USERS: env.BASEROW_TABLE_TENANT_USERS ?? '',
  RECIPES: env.BASEROW_TABLE_RECIPES ?? '',
  CATEGORIES: env.BASEROW_TABLE_CATEGORIES ?? '',
  SETTINGS: env.BASEROW_TABLE_SETTINGS ?? '',
  PAYMENT_ORDERS: env.BASEROW_TABLE_PAYMENT_ORDERS ?? '',
  PAYMENT_EVENTS: env.BASEROW_TABLE_PAYMENT_EVENTS ?? '',
  RECIPE_PURCHASES: env.BASEROW_TABLE_RECIPE_PURCHASES ?? '',
  AUDIT_LOGS: env.BASEROW_TABLE_AUDIT_LOGS ?? '',
  SESSIONS: env.BASEROW_TABLE_SESSIONS ?? '',
  MAGIC_LINKS: env.BASEROW_TABLE_MAGIC_LINKS ?? '',
  FAVORITES: env.BASEROW_TABLE_FAVORITES ?? '',
  COMMENTS: env.BASEROW_TABLE_COMMENTS ?? '',
  RATINGS: env.BASEROW_TABLE_RATINGS ?? '',
  SHOPPING_LIST: env.BASEROW_TABLE_SHOPPING_LIST ?? '',
  NEWSLETTER: env.BASEROW_TABLE_NEWSLETTER ?? '',
  OAUTH_STATES: env.BASEROW_TABLE_OAUTH_STATES ?? '',
  STRIPE_CONNECTIONS: env.BASEROW_TABLE_STRIPE_CONNECTIONS ?? '',
  STRIPE_OAUTH_STATES: env.BASEROW_TABLE_STRIPE_OAUTH_STATES ?? '',
} as const;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function backoffDelay(attempt: number) {
  const base = 200 * 2 ** attempt;
  const jitter = Math.floor(Math.random() * 150);
  return base + jitter;
}

function buildUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path;
  const baseUrl = (env.BASEROW_API_URL || DEFAULT_BASEROW_URL).replace(/\/+$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
}

function isRetryableStatus(status: number) {
  return status === 408 || status === 425 || status === 429 || status >= 500;
}

function isRetryableError(error: unknown) {
  if (error instanceof BaserowError) {
    return isRetryableStatus(error.status);
  }

  return (
    error instanceof Error &&
    (error.name === 'AbortError' || /fetch|network|timeout/i.test(error.message))
  );
}

async function parseResponseBody(response: Response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function createHeaders(init?: RequestInit) {
  const headers = new Headers(init?.headers);
  const token = env.BASEROW_API_TOKEN;

  if (!token) {
    throw new BaserowError(500, 'BASEROW_API_TOKEN nao configurado.');
  }

  if (!headers.has('Authorization')) {
    headers.set('Authorization', `Token ${token}`);
  }

  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }

  if (init?.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  return headers;
}

export async function fetchBaserow<T>(
  path: string,
  init: RequestInit = {},
  options: BaserowFetchOptions = {}
): Promise<T> {
  const method = (init.method ?? 'GET').toUpperCase();
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const endpoint = options.endpoint ?? path;
  const idempotent = (options.idempotent ?? method === 'GET') || method === 'HEAD';
  const maxRetries = idempotent ? (options.retries ?? DEFAULT_RETRIES) : 0;

  for (let attempt = 0; ; attempt += 1) {
    const controller = new AbortController();
    const abortListener = () => controller.abort();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    if (init.signal?.aborted) {
      controller.abort();
    } else if (init.signal) {
      init.signal.addEventListener('abort', abortListener, { once: true });
    }

    try {
      const response = await fetch(buildUrl(path), {
        ...init,
        headers: createHeaders(init),
        signal: controller.signal,
      });

      const body = await parseResponseBody(response);
      if (!response.ok) {
        throw new BaserowError(response.status, `Baserow HTTP ${response.status}`, body, endpoint);
      }

      return body as T;
    } catch (error) {
      if (attempt >= maxRetries || !isRetryableError(error)) {
        throw error;
      }

      await sleep(backoffDelay(attempt));
    } finally {
      clearTimeout(timer);
      if (init.signal) {
        init.signal.removeEventListener('abort', abortListener);
      }
    }
  }
}

export const baserowFetch = fetchBaserow;
