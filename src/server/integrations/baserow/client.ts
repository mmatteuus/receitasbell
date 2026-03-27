import { env } from "../../shared/env.js";
import { logger } from "../../shared/logger.js";
import { BASEROW_TABLES } from "./tables.js";

export class BaserowError extends Error {
  constructor(public status: number, message: string, public body?: unknown) {
    super(message);
    this.name = "BaserowError";
  }
}

type BaserowFetchOptions = {
  endpoint?: string;
  idempotent?: boolean;
  timeoutMs?: number;
  retryAttempts?: number;
};

type FetchInit = RequestInit & {
  headers?: RequestInit["headers"];
};

const DEFAULT_TIMEOUT_MS = Number(env.BASEROW_TIMEOUT_MS || 15000);

function isRetryableStatus(status: number) {
  return status === 429 || (status >= 500 && status <= 599);
}

function isIdempotentMethod(method: string) {
  return ["GET", "HEAD", "OPTIONS", "PUT", "DELETE"].includes(method.toUpperCase());
}

function parseRetryAfterMs(res: Response) {
  const header = res.headers.get("retry-after");
  if (!header) return null;
  const seconds = Number(header);
  if (Number.isFinite(seconds) && seconds > 0) {
    return seconds * 1000;
  }

  const date = Date.parse(header);
  if (Number.isFinite(date)) {
    return Math.max(0, date - Date.now());
  }

  return null;
}

function jitterDelay(baseMs: number, attempt: number) {
  const exponential = baseMs * (2 ** Math.max(0, attempt - 1));
  const capped = Math.min(exponential, 2000);
  const jitter = 0.5 + Math.random();
  return Math.max(50, Math.round(capped * jitter));
}

async function parseResponseBody(res: Response) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export async function baserowFetch<T>(path: string, init: FetchInit = {}, options: BaserowFetchOptions = {}): Promise<T> {
  const base = (env.BASEROW_API_URL || "https://api.baserow.io").replace(/\/$/, "");
  const url = `${base}${path}`;
  const method = (init.method || "GET").toUpperCase();
  const idempotent = options.idempotent ?? isIdempotentMethod(method);
  const retryAttempts = options.retryAttempts ?? (idempotent ? 3 : 1);
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const logicalEndpoint = options.endpoint || path.replace(/\?.*$/, "").replace(/\/[0-9]+\/?$/, "/:id/");

  for (let attempt = 1; attempt <= retryAttempts; attempt += 1) {
    const controller = new AbortController();
    const startedAt = Date.now();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(url, {
        ...init,
        method,
        signal: controller.signal,
        headers: {
          Authorization: `Token ${env.BASEROW_API_TOKEN}`,
          "Content-Type": "application/json",
          ...(init.headers || {}),
        },
      });

      const latencyMs = Date.now() - startedAt;
      const data = await parseResponseBody(res);
      const retryable = isRetryableStatus(res.status);

      logger.debug("baserow.request", {
        action: "baserow.request",
        endpoint: logicalEndpoint,
        method,
        attempt,
        latencyMs,
        status: res.status,
        retryable,
        idempotent,
      });

      if (!res.ok) {
        if (retryable && attempt < retryAttempts) {
          const retryAfterMs = parseRetryAfterMs(res);
          const delayMs = retryAfterMs ?? jitterDelay(120, attempt);
          logger.warn("baserow.retry", {
            action: "baserow.retry",
            endpoint: logicalEndpoint,
            method,
            attempt,
            latencyMs,
            status: res.status,
            delayMs,
            idempotent,
          });
          await sleep(delayMs);
          continue;
        }

        throw new BaserowError(res.status, `Baserow HTTP ${res.status}`, data);
      }

      return data as T;
    } catch (error) {
      const latencyMs = Date.now() - startedAt;
      const retryable = idempotent && attempt < retryAttempts && (
        error instanceof DOMException
          ? error.name === "AbortError"
          : true
      );

      logger.warn("baserow.request_failed", {
        action: "baserow.request_failed",
        endpoint: logicalEndpoint,
        method,
        attempt,
        latencyMs,
        retryable,
        idempotent,
        error: error instanceof Error ? { name: error.name, message: error.message } : String(error),
      });

      if (!retryable) {
        throw error;
      }

      const delayMs = jitterDelay(120, attempt);
      logger.warn("baserow.retry", {
        action: "baserow.retry",
        endpoint: logicalEndpoint,
        method,
        attempt,
        latencyMs,
        status: error instanceof BaserowError ? error.status : 0,
        delayMs,
        idempotent,
      });
      await sleep(delayMs);
    } finally {
      clearTimeout(timeout);
    }
  }

  throw new Error(`Baserow request failed after ${retryAttempts} attempts: ${logicalEndpoint}`);
}

// Alias legado para compatibilidade durante a migração
export const fetchBaserow = baserowFetch;
export { BASEROW_TABLES };
