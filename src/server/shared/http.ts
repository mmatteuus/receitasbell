import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Logger } from "./logger.js";
import { env } from "./env.js";

export class ApiError extends Error {
  constructor(public status: number, message: string, public details?: unknown) {
    super(message);
    this.name = 'ApiError';
  }
}

export function assertMethod(request: VercelRequest, methods: string[]) {
  if (!methods.includes(request.method ?? "")) {
    throw new ApiError(405, `Method ${request.method} not allowed`);
  }
}

/**
 * Vercel Cron: com CRON_SECRET configurado, a Vercel envia Authorization automaticamente.
 * Doc oficial: CRON_SECRET -> Authorization header.
 */
export function requireCronAuth(request: VercelRequest) {
  const authHeader = request.headers.authorization;
  if (!authHeader || authHeader !== `Bearer ${env.CRON_SECRET}`) {
    throw new ApiError(401, "Unauthorized");
  }
}

export function sendJson(response: VercelResponse, status: number, body: unknown) {
  response.status(status).json(body);
}

// Para manter compatibilidade com código existente que usa json()
export const json = sendJson;

export function requireQueryParam(request: VercelRequest, name: string): string {
  const value = request.query[name];
  if (!value || typeof value !== "string") throw new ApiError(400, `Missing required query parameter: ${name}`);
  return value;
}

/**
 * Lê JSON do body com fallback para stream (Vercel geralmente já parseia).
 */
export async function readJsonBody<T>(request: VercelRequest): Promise<T> {
  if (request.body && typeof request.body === "object" && !Array.isArray(request.body)) {
    return request.body as T;
  }
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => (body += chunk));
    request.on("end", () => {
      try {
        resolve(JSON.parse(body) as T);
      } catch {
        reject(new ApiError(400, "Invalid JSON body"));
      }
    });
  });
}

export function getAppBaseUrl(request: VercelRequest): string {
  const host = request.headers.host;
  const protocol = host?.includes("localhost") ? "http" : "https";
  return `${protocol}://${host}`;
}

export function getQueryValue(value: string | string[] | undefined): string | null {
  if (!value) return null;
  if (Array.isArray(value)) return value[0];
  return value;
}

export function getClientAddress(request: VercelRequest): string {
  const forwarded = request.headers["x-forwarded-for"];
  if (Array.isArray(forwarded)) return forwarded[0]?.split(",")[0]?.trim() || "unknown";
  if (typeof forwarded === "string") return forwarded.split(",")[0]?.trim() || "unknown";
  return request.socket.remoteAddress || "unknown";
}

function setDefaultApiHeaders(response: VercelResponse) {
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("Referrer-Policy", "no-referrer");
}

export async function withApiHandler(
  request: VercelRequest,
  response: VercelResponse,
  handler: (context: { logger: Logger; requestId: string }) => Promise<void | unknown> | void | unknown
) {
  setDefaultApiHeaders(response);

  const requestId = (request.headers["x-vercel-id"] as string) || (request.headers["x-request-id"] as string) || crypto.randomUUID();
  const logger = new Logger({ requestId, path: request.url, method: request.method });

  try {
    const result = await handler({ logger, requestId });
    if (result && !response.writableEnded) {
       return sendJson(response, 200, result);
    }
  } catch (error: any) {
    if (error instanceof ApiError) {
      return sendJson(response, error.status, { error: { message: error.message, details: error.details ?? null }, requestId });
    }
    logger.error("Unhandled API error", error);
    return sendJson(response, 500, { error: { message: "Internal server error" }, requestId });
  }
}
