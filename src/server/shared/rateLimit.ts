import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { isProd } from "./env.js";
import { logger } from "./logger.js";

type RateLimitResult = {
  success: boolean;
  remaining: number;
  resetAfter: number;
  backend: RateLimitBackend;
  degraded: boolean;
};

type RateLimitUnit = "s" | "m" | "h" | "d";
type RateLimitWindow = `${number} ${RateLimitUnit}` | `${number}${RateLimitUnit}`;
type RateLimitBackend = "upstash" | "memory";

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL || "";
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || "";

function isValidUpstashValue(value: string) {
  return Boolean(value && value !== "UNSPECIFIED");
}

function isValidUpstashUrl(value: string) {
  return isValidUpstashValue(value) && /^https?:\/\//.test(value);
}

let upstashRedis: Redis | null = null;
let upstashInitError: Error | null = null;

function getUpstashRedis(): Redis | null {
  if (upstashRedis || upstashInitError) return upstashRedis;
  if (!isValidUpstashUrl(UPSTASH_URL) || !isValidUpstashValue(UPSTASH_TOKEN)) {
    return null;
  }

  try {
    upstashRedis = new Redis({
      url: UPSTASH_URL,
      token: UPSTASH_TOKEN,
      fetch: (input: any, init: any) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout
        return fetch(input, { ...init, signal: controller.signal }).finally(() => clearTimeout(timeoutId));
      },
    } as any);
  } catch (error) {
    upstashInitError = error instanceof Error ? error : new Error(String(error));
  }
  return upstashRedis;
}

let lastBackend: RateLimitBackend = "memory";
let warnedMemoryFallback = false;

/**
 * In-memory fallback for environments without Redis.
 * Note: Limited effectiveness in serverless due to instance isolation.
 */
const memoryStore = new Map<string, { count: number; windowStart: number; blockedUntil?: number }>();

function parseWindowSeconds(window: RateLimitWindow): number {
  const normalized = window.replace(/\s+/g, "");
  const match = /^(\d+)([smhd])$/.exec(normalized);
  if (!match) return 60;

  const amount = Number(match[1]);
  const unit = match[2] as RateLimitUnit;
  const multiplier: Record<RateLimitUnit, number> = {
    s: 1,
    m: 60,
    h: 3600,
    d: 86400,
  };

  return Math.max(1, amount * multiplier[unit]);
}

function consumeMemoryLimit(key: string, limit: number, windowSeconds: number): RateLimitResult {
  const now = Date.now();
  const entry = memoryStore.get(key);

  const state = (!entry || (now - entry.windowStart > windowSeconds * 1000))
    ? { count: 0, windowStart: now, blockedUntil: undefined }
    : entry;

  if (state.blockedUntil && state.blockedUntil > now) {
    return {
      success: false,
      remaining: 0,
      resetAfter: Math.ceil((state.blockedUntil - now) / 1000),
      backend: "memory",
      degraded: true,
    };
  }

  const nextCount = state.count + 1;
  const resetAfter = Math.ceil((state.windowStart + windowSeconds * 1000 - now) / 1000);

  if (nextCount > limit) {
    state.blockedUntil = now + windowSeconds * 1000;
    state.count = 0;
    state.windowStart = now;
    memoryStore.set(key, state);
    return {
      success: false,
      remaining: 0,
      resetAfter: windowSeconds,
      backend: "memory",
      degraded: true,
    };
  }

  state.count = nextCount;
  memoryStore.set(key, state);

  return {
    success: true,
    remaining: limit - nextCount,
    resetAfter: resetAfter > 0 ? resetAfter : windowSeconds,
    backend: "memory",
    degraded: true,
  };
}

function logRateLimitAttempt(input: {
  backend: RateLimitBackend;
  endpoint: string;
  key: string;
  attempt: number;
  latencyMs: number;
  status: number;
  retryable: boolean;
}) {
  logger.debug("rate_limit.attempt", {
    action: "rate_limit.attempt",
    backend: input.backend,
    endpoint: input.endpoint,
    key: input.key,
    attempt: input.attempt,
    latencyMs: input.latencyMs,
    status: input.status,
    retryable: input.retryable,
  });
}

function logRateLimitFallback(input: {
  endpoint: string;
  key: string;
  error: unknown;
}) {
  logger.warn("rate_limit.fallback", {
    action: "rate_limit.fallback",
    backend: "memory",
    endpoint: input.endpoint,
    key: input.key,
    reason: input.error instanceof Error ? input.error.message : String(input.error),
    production: isProd,
  });
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function jitterDelay(baseMs: number, attempt: number) {
  const exponential = baseMs * (2 ** Math.max(0, attempt - 1));
  const capped = Math.min(exponential, 1500);
  const jitter = 0.5 + Math.random();
  return Math.max(50, Math.round(capped * jitter));
}

/**
 * Standardized Rate Limiter.
 * Uses Upstash Redis if configured, otherwise falls back to memory.
 */
export async function rateLimit(
  key: string,
  options: { limit: number; window: RateLimitWindow; endpoint?: string; idempotent?: boolean } = { limit: 1, window: "1m" },
): Promise<RateLimitResult> {
  const endpoint = options.endpoint || "unknown";
  const windowSeconds = parseWindowSeconds(options.window);
  const canRetry = options.idempotent ?? false;
  const safeAttempts = canRetry ? 3 : 1;

  const redis = getUpstashRedis();
  if (!redis) {
    if (isProd && !warnedMemoryFallback) {
      warnedMemoryFallback = true;
      logger.warn("rate_limit.backend_unavailable", {
        action: "rate_limit.backend_unavailable",
        backend: "memory",
        endpoint,
        key,
        reason: upstashInitError ? upstashInitError.message : "upstash_not_configured",
      });
    }
    lastBackend = "memory";
    return consumeMemoryLimit(key, options.limit, windowSeconds);
  }

  for (let attempt = 1; attempt <= safeAttempts; attempt += 1) {
    const startedAt = Date.now();
    try {
      const limiter = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(options.limit, options.window),
      });

      const result = await limiter.limit(key);
      const latencyMs = Date.now() - startedAt;
      lastBackend = "upstash";
      logRateLimitAttempt({
        backend: "upstash",
        endpoint,
        key,
        attempt,
        latencyMs,
        status: result.success ? 200 : 429,
        retryable: false,
      });
      return {
        success: result.success,
        remaining: result.remaining,
        resetAfter: Math.max(1, Math.ceil((result.reset - Date.now()) / 1000)),
        backend: "upstash",
        degraded: false,
      };
    } catch (error) {
      const latencyMs = Date.now() - startedAt;
      const retryable = canRetry && attempt < safeAttempts;
      logRateLimitAttempt({
        backend: "upstash",
        endpoint,
        key,
        attempt,
        latencyMs,
        status: 500,
        retryable,
      });

      if (!retryable) {
        logRateLimitFallback({ endpoint, key, error });
        lastBackend = "memory";
        return consumeMemoryLimit(key, options.limit, windowSeconds);
      }

      await sleep(jitterDelay(100, attempt));
    }
  }

  lastBackend = "memory";
  return consumeMemoryLimit(key, options.limit, windowSeconds);
}

export function getRateLimitBackend(): RateLimitBackend {
  return lastBackend;
}

export function hasRateLimitFallback() {
  return lastBackend === "memory";
}

/**
 * Specialized rate limits
 */
export const AuthRateLimit = {
  async check(identifier: string) {
    return rateLimit(`auth:${identifier}`, { limit: 5, window: "5m", endpoint: "auth", idempotent: false });
  }
};

export const AdminRateLimit = {
  async check(identifier: string) {
    return rateLimit(`admin:${identifier}`, { limit: 10, window: "1m", endpoint: "admin", idempotent: false });
  }
};
