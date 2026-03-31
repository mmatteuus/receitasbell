import { buildTenantAdminPath, getCurrentTenantSlug } from '@/lib/tenant';

export class ApiClientError extends Error {
  status: number;
  details?: unknown;
  requestId?: string;

  constructor(status: number, message: string, details?: unknown, requestId?: string) {
    super(message);
    this.status = status;
    this.details = details;
    this.requestId = requestId;
  }
}

interface JsonFetchOptions extends Omit<RequestInit, 'body'> {
  admin?: boolean;
  body?: BodyInit | Record<string, unknown> | unknown[] | null;
}

const CSRF_COOKIE_NAME = '__Host-rb_csrf';

function isBodyInit(value: JsonFetchOptions['body']): value is BodyInit {
  return (
    typeof value === 'string' ||
    value instanceof Blob ||
    value instanceof FormData ||
    value instanceof URLSearchParams ||
    value instanceof ArrayBuffer ||
    ArrayBuffer.isView(value)
  );
}

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const entries = document.cookie.split(';').map((part) => part.trim());
  for (const entry of entries) {
    if (!entry) continue;
    const idx = entry.indexOf('=');
    if (idx <= 0) continue;
    const key = entry.slice(0, idx);
    if (key !== name) continue;
    return decodeURIComponent(entry.slice(idx + 1));
  }
  return null;
}

function createClientCsrfToken() {
  if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
    const bytes = new Uint8Array(16);
    window.crypto.getRandomValues(bytes);
    return Array.from(bytes, (value) => value.toString(16).padStart(2, '0')).join('');
  }
  return `${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`;
}

function ensureClientCsrfCookie() {
  if (typeof document === 'undefined') return null;
  const existing = readCookie(CSRF_COOKIE_NAME);
  if (existing) return existing;

  const token = createClientCsrfToken();
  const secure =
    typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${CSRF_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; SameSite=Lax${secure}`;
  return token;
}

async function safeParseResponse(response: Response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

function getErrorMessage(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== 'object') return fallback;

  const anyPayload = payload as Record<string, unknown>;
  if (typeof anyPayload.message === 'string') return anyPayload.message;
  if (typeof anyPayload.error === 'string') return anyPayload.error;
  if (typeof anyPayload.detail === 'string') return anyPayload.detail;
  if (typeof anyPayload.title === 'string') return anyPayload.title;

  if (
    typeof anyPayload.error === 'object' &&
    anyPayload.error &&
    typeof (anyPayload.error as Record<string, unknown>).message === 'string'
  ) {
    return (anyPayload.error as Record<string, unknown>).message as string;
  }

  if (typeof anyPayload.raw === 'string') return anyPayload.raw;
  return fallback;
}

export function buildQuery(
  params: Record<string, string | number | boolean | undefined | null | string[]>
) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    if (Array.isArray(value)) {
      if (!value.length) continue;
      search.set(key, value.join(','));
      continue;
    }
    search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : '';
}

export async function jsonFetch<T>(path: string, options: JsonFetchOptions = {}): Promise<T> {
  const { admin = false, headers: rawHeaders, body, ...init } = options;
  const headers = new Headers(rawHeaders);
  const tenantSlug = typeof window !== 'undefined' ? getCurrentTenantSlug() : null;
  if (tenantSlug) {
    headers.set('X-Tenant-Slug', tenantSlug);
  }

  let nextBody: BodyInit | undefined;
  if (body !== undefined && body !== null) {
    if (isBodyInit(body)) {
      nextBody = body;
    } else {
      headers.set('Content-Type', 'application/json');
      nextBody = JSON.stringify(body);
    }
  }

  const method = (init.method || 'GET').toUpperCase();
  if (method !== 'GET' && method !== 'HEAD') {
    const csrfToken = ensureClientCsrfCookie();
    if (csrfToken) {
      headers.set('X-CSRF-Token', csrfToken);
    }
  }

  const response = await fetch(path, {
    credentials: 'same-origin',
    ...init,
    headers,
    body: nextBody,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const payload = await safeParseResponse(response);

  if (!response.ok) {
    if (admin && response.status === 401) {
      const loginPath = buildTenantAdminPath('login', tenantSlug);
      if (typeof window !== 'undefined' && window.location.pathname !== loginPath) {
        const redirect = `${window.location.pathname}${window.location.search}${window.location.hash}`;
        window.location.assign(`${loginPath}?redirect=${encodeURIComponent(redirect)}`);
      }
    }
    throw new ApiClientError(
      response.status,
      getErrorMessage(payload, response.statusText || 'Erro ao comunicar com a API.'),
      payload,
      typeof payload === 'object' && payload
        ? 'requestId' in payload
          ? String((payload as Record<string, unknown>).requestId)
          : 'request_id' in payload
            ? String((payload as Record<string, unknown>).request_id)
            : undefined
        : undefined
    );
  }

  return payload as T;
}
