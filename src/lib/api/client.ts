import { clearAdminSecret, ensureAdminSecret } from "./identity";

export class ApiClientError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
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

  let nextBody: BodyInit | undefined;
  if (body !== undefined && body !== null) {
    if (isBodyInit(body)) {
      nextBody = body;
    } else {
      headers.set("Content-Type", "application/json");
      nextBody = JSON.stringify(body);
    }
  }

  if (admin) {
    const secret = await ensureAdminSecret();
    if (!secret) {
      throw new ApiClientError(401, "Autenticacao de admin cancelada.");
    }
    headers.set("x-admin-secret", secret);
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
      clearAdminSecret();
    }
    throw new ApiClientError(
      response.status,
      payload?.error || payload?.message || response.statusText || "Erro ao comunicar com a API.",
      payload?.details,
    );
  }

  return payload as T;
}

