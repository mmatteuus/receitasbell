import { buildTenantAdminPath, getCurrentTenantSlug } from "@/lib/tenant";

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

interface JsonFetchOptions extends Omit<RequestInit, "body"> {
  admin?: boolean;
  body?: BodyInit | Record<string, unknown> | unknown[] | null;
}

const CSRF_COOKIE_NAME = "__Host-rb_csrf";

function isBodyInit(value: JsonFetchOptions["body"]): value is BodyInit {
  return (
    typeof value === "string" ||
    value instanceof Blob ||
    value instanceof FormData ||
    value instanceof URLSearchParams ||
    value instanceof ArrayBuffer ||
    ArrayBuffer.isView(value)
  );
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const entries = document.cookie.split(";").map((part) => part.trim());
  for (const entry of entries) {
    if (!entry) continue;
    const idx = entry.indexOf("=");
    if (idx <= 0) continue;
    const key = entry.slice(0, idx);
    if (key !== name) continue;
    return decodeURIComponent(entry.slice(idx + 1));
  }
  return null;
}

function createClientCsrfToken() {
  if (typeof window !== "undefined" && window.crypto?.getRandomValues) {
    const bytes = new Uint8Array(16);
    window.crypto.getRandomValues(bytes);
    return Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("");
  }
  return `${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`;
}

function ensureClientCsrfCookie() {
  if (typeof document === "undefined") return null;
  const existing = readCookie(CSRF_COOKIE_NAME);
  if (existing) return existing;

  const token = createClientCsrfToken();
  const secure = typeof window !== "undefined" && window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${CSRF_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; SameSite=Lax${secure}`;
  return token;
}

export function buildQuery(params: Record<string, string | number | boolean | undefined | null | string[]>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    if (Array.isArray(value)) {
      if (!value.length) continue;
      search.set(key, value.join(","));
      continue;
    }
    search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : "";
}

export async function jsonFetch<T>(path: string, options: JsonFetchOptions = {}): Promise<T> {
  const { admin = false, headers: rawHeaders, body, ...init } = options;
  const headers = new Headers(rawHeaders);
  const tenantSlug = typeof window !== "undefined" ? getCurrentTenantSlug() : null;
  if (tenantSlug) {
    headers.set("X-Tenant-Slug", tenantSlug);
  }

  let nextBody: BodyInit | undefined;
  if (body !== undefined && body !== null) {
    if (isBodyInit(body)) {
      nextBody = body;
    } else {
      headers.set("Content-Type", "application/json");
      nextBody = JSON.stringify(body);
    }
  }

  const method = (init.method || "GET").toUpperCase();
  if (method !== "GET" && method !== "HEAD") {
    const csrfToken = ensureClientCsrfCookie();
    if (csrfToken) {
      headers.set("X-CSRF-Token", csrfToken);
    }
  }

  const response = await fetch(path, {
    credentials: "same-origin",
    ...init,
    headers,
    body: nextBody,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const nestedError =
      payload && typeof payload === "object" && payload.error && typeof payload.error === "object"
        ? (payload.error as { message?: unknown; details?: unknown })
        : null;
    const nestedMessage =
      payload && typeof payload === "object" && typeof payload.error === "string"
        ? payload.error
        : nestedError?.message;
    const nestedDetails = nestedError?.details;

    if (admin && response.status === 401) {
      const loginPath = buildTenantAdminPath("login", tenantSlug);
      if (typeof window !== "undefined" && window.location.pathname !== loginPath) {
        const redirect = `${window.location.pathname}${window.location.search}${window.location.hash}`;
        window.location.assign(
          `${loginPath}?redirect=${encodeURIComponent(redirect)}`,
        );
      }
      throw new ApiClientError(401, "Sessão de admin expirada. Faça login novamente.", nestedDetails ?? payload?.details, payload?.requestId);
    }
    throw new ApiClientError(
      response.status,
      (typeof nestedMessage === "string" ? nestedMessage : undefined)
        || payload?.message
        || response.statusText
        || "Erro ao comunicar com a API.",
      nestedDetails ?? payload?.details,
      payload?.requestId,
    );
  }

  return payload as T;
}
