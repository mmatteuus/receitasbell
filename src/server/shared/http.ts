import type { VercelRequest, VercelResponse } from "@vercel/node";
import crypto from "node:crypto";
import { env } from "./env.js";
import { Logger } from "./logger.js";

export class ApiError extends Error {
  constructor(public status: number, message: string, public details?: unknown) {
    super(message);
    this.name = "ApiError";
  }
}

export function assertMethod(req: VercelRequest, allowed: string[]) {
  const m = (req.method ?? "GET").toUpperCase();
  if (!allowed.includes(m)) throw new ApiError(405, `Method ${m} not allowed`);
}

export function requireCronAuth(req: VercelRequest) {
  const auth = req.headers.authorization;
  if (auth === `Bearer ${env.CRON_SECRET}`) return;
  const querySecret = getQueryValue(req, "secret");
  if (querySecret && querySecret === env.CRON_SECRET) return;
  throw new ApiError(401, "Unauthorized");
}

export function noStore(res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store");
}

export function setPublicCache(res: VercelResponse, seconds: number, staleWhileRevalidate?: number) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const swr = Math.max(0, Math.floor(staleWhileRevalidate ?? Math.floor(safeSeconds / 2)));
  res.setHeader("Cache-Control", `public, s-maxage=${safeSeconds}, stale-while-revalidate=${swr}`);
}

export function json(res: VercelResponse, status: number, body: unknown) {
  if (!res.getHeader("Cache-Control")) {
    noStore(res);
  }
  res.status(status).json(body);
}

export function sendJson(res: VercelResponse, status: number, body: unknown) {
  return json(res, status, body);
}

export function requestId(req: VercelRequest) {
  const existing = req.headers["x-vercel-id"];
  if (typeof existing === "string" && existing) return existing;
  return crypto.randomUUID();
}

function getHeaderValue(value: string | string[] | undefined): string | undefined {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (Array.isArray(value) && value.length) {
    const first = value[0];
    if (typeof first === "string" && first.trim()) return first.trim();
  }
  return undefined;
}

export function getClientAddress(req: VercelRequest) {
  const xff = getHeaderValue(req.headers["x-forwarded-for"]);
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  return (
    getHeaderValue(req.headers["x-real-ip"]) ||
    getHeaderValue(req.headers["x-vercel-forwarded-for"]) ||
    "unknown"
  );
}

export function getRequestOrigin(req: VercelRequest) {
  const forwardedHost = getHeaderValue(req.headers["x-forwarded-host"]);
  const host = forwardedHost || getHeaderValue(req.headers.host) || "localhost";
  const proto = getHeaderValue(req.headers["x-forwarded-proto"]) || "http";
  return `${proto}://${host}`;
}

export function getAppBaseUrl(req: VercelRequest) {
  return (env.APP_BASE_URL || "").replace(/\/+$/, "") || getRequestOrigin(req);
}

export function getQueryValue(req: VercelRequest, key: string): string | null {
  const fromQuery = req.query?.[key];
  if (typeof fromQuery === "string") return fromQuery;
  if (Array.isArray(fromQuery) && fromQuery.length) {
    const first = fromQuery[0];
    return typeof first === "string" ? first : null;
  }

  try {
    const url = new URL(req.url || "/", getRequestOrigin(req));
    return url.searchParams.get(key);
  } catch {
    return null;
  }
}

export async function readJsonBody<T>(req: VercelRequest): Promise<T> {
  if (typeof req.body === "string") {
    if (!req.body.trim()) return {} as T;
    return JSON.parse(req.body) as T;
  }
  if (req.body == null) return {} as T;
  return req.body as T;
}

export async function withApiHandler(
  req: VercelRequest,
  res: VercelResponse,
  handler: (ctx: { requestId: string; logger: Logger }) => Promise<void>
) {
  const rid = requestId(req);
  const logger = Logger.fromRequest(req, { requestId: rid });
  res.setHeader("x-request-id", rid);
  try {
    await handler({ requestId: rid, logger });
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      logger.warn("API error", { status: error.status, message: error.message, details: error.details ?? null });
      return json(res, error.status, {
        success: false,
        error: { message: error.message, details: error.details ?? null },
        requestId: rid,
      });
    }

    logger.error("Unhandled API error", error);
    return json(res, 500, {
      success: false,
      error: { message: "Internal server error" },
      requestId: rid,
    });
  }
}
