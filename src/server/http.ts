import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getAdminApiSecret } from "./env.js";

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export function sendJson(response: VercelResponse, status: number, data: unknown) {
  response.setHeader("Cache-Control", "no-store");
  response.status(status).json(data);
}

export function sendNoContent(response: VercelResponse) {
  response.setHeader("Cache-Control", "no-store");
  response.status(204).end();
}

export function sendError(response: VercelResponse, error: unknown) {
  if (error instanceof ApiError) {
    return sendJson(response, error.status, {
      error: error.message,
      details: error.details ?? null,
    });
  }

  const message = error instanceof Error ? error.message : "Internal server error";
  return sendJson(response, 500, { error: message });
}

export async function withApiHandler(
  request: VercelRequest,
  response: VercelResponse,
  handler: () => Promise<void>,
) {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type, x-admin-secret");
  response.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");

  if (request.method === "OPTIONS") {
    return sendNoContent(response);
  }

  try {
    await handler();
  } catch (error) {
    sendError(response, error);
  }
}

export function assertMethod(request: VercelRequest, methods: string[]) {
  if (!request.method || !methods.includes(request.method)) {
    throw new ApiError(405, `Method ${request.method ?? "UNKNOWN"} not allowed`);
  }
}

export async function readJsonBody<T>(request: VercelRequest): Promise<T> {
  if (request.body !== undefined && request.body !== null && request.body !== "") {
    if (typeof request.body === "string") {
      return JSON.parse(request.body) as T;
    }

    if (Buffer.isBuffer(request.body)) {
      return JSON.parse(request.body.toString("utf-8")) as T;
    }

    return request.body as T;
  }

  const chunks: Uint8Array[] = [];
  for await (const chunk of request) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }

  if (!chunks.length) {
    return {} as T;
  }

  return JSON.parse(Buffer.concat(chunks).toString("utf-8")) as T;
}

export function getCookie(request: VercelRequest, name: string) {
  const cookieHeader = request.headers.cookie;
  if (!cookieHeader) return undefined;

  const parts = cookieHeader.split(";");
  for (const part of parts) {
    const [rawName, ...rawValue] = part.trim().split("=");
    if (rawName === name) {
      return decodeURIComponent(rawValue.join("="));
    }
  }

  return undefined;
}

export function getIdentityEmail(request: VercelRequest) {
  return getCookie(request, "rb_user_email")?.trim().toLowerCase();
}

export function requireIdentityEmail(request: VercelRequest) {
  const email = getIdentityEmail(request);
  if (!email) {
    throw new ApiError(401, "Identity email is required");
  }
  return email;
}

export function hasAdminAccess(request: VercelRequest) {
  const secret = request.headers["x-admin-secret"];
  if (Array.isArray(secret)) {
    return secret.includes(getAdminApiSecret());
  }
  return secret === getAdminApiSecret();
}

export function requireAdminAccess(request: VercelRequest) {
  if (!hasAdminAccess(request)) {
    throw new ApiError(401, "Admin authentication required");
  }
}

export function parseStringArray(value: unknown) {
  if (Array.isArray(value)) {
    return value.flatMap((entry) => String(entry).split(",")).map((entry) => entry.trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value.split(",").map((entry) => entry.trim()).filter(Boolean);
  }

  return [];
}

export function parseBoolean(value: string | undefined, fallback = false) {
  if (value === undefined) return fallback;
  return value === "true" || value === "1";
}

export function requireQueryParam(request: VercelRequest, key: string) {
  const value = request.query[key];
  const normalized = Array.isArray(value) ? value[0] : value;
  if (!normalized) {
    throw new ApiError(400, `Missing query parameter: ${key}`);
  }
  return String(normalized);
}
