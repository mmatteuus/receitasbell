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
    if (admin && response.status === 401) {
      const loginPath = buildTenantAdminPath("login", tenantSlug);
      if (typeof window !== "undefined" && window.location.pathname !== loginPath) {
        const redirect = `${window.location.pathname}${window.location.search}${window.location.hash}`;
        window.location.assign(
          `${loginPath}?redirect=${encodeURIComponent(redirect)}`,
        );
      }
      throw new ApiClientError(401, "Sessão de admin expirada. Faça login novamente.", payload?.details, payload?.requestId);
    }
    throw new ApiClientError(
      response.status,
      payload?.error || payload?.message || response.statusText || "Erro ao comunicar com a API.",
      payload?.details,
      payload?.requestId,
    );
  }

  return payload as T;
}
