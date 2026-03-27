import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { env } from "../shared/env.js";

type RateLimitResult = {
  success: boolean;
  remaining: number;
  resetAfter: number;
};

type RateLimitUnit = "s" | "m" | "h" | "d";
type RateLimitWindow = `${number} ${RateLimitUnit}` | `${number}${RateLimitUnit}`;

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

let upstashRedis: Redis | null = null;
if (UPSTASH_URL && UPSTASH_TOKEN) {
  upstashRedis = new Redis({ url: UPSTASH_URL, token: UPSTASH_TOKEN });
}

/**
 * In-memory fallback for environments without Redis.
 * Note: Limited effectiveness in serverless due to instance isolation.
 */
const memoryStore = new Map<string, { count: number; windowStart: number; blockedUntil?: number }>();

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
    };
  }

  state.count = nextCount;
  memoryStore.set(key, state);

  return {
    success: true,
    remaining: limit - nextCount,
    resetAfter: resetAfter > 0 ? resetAfter : windowSeconds,
  };
}

/**
 * Standardized Rate Limiter.
 * Uses Upstash Redis if configured, otherwise falls back to memory.
 */
export async function rateLimit(key: string, options: { limit: number; window: RateLimitWindow }): Promise<RateLimitResult> {
  if (upstashRedis) {
    const limiter = new Ratelimit({
      redis: upstashRedis,
      limiter: Ratelimit.slidingWindow(options.limit, options.window),
    });
    
    const result = await limiter.limit(key);
    return {
      success: result.success,
      remaining: result.remaining,
      resetAfter: Math.max(1, Math.ceil((result.reset - Date.now()) / 1000)),
    };
  }

  // Pure memory fallback
  const windowSeconds = options.window.includes("m") 
    ? parseInt(options.window) * 60 
    : parseInt(options.window);
    
  return consumeMemoryLimit(key, options.limit, windowSeconds || 60);
}

/**
 * Specialized rate limits
 */
export const AuthRateLimit = {
  async check(identifier: string) {
    return rateLimit(`auth:${identifier}`, { limit: 5, window: "5 m" });
  }
};

export const AdminRateLimit = {
  async check(identifier: string) {
    return rateLimit(`admin:${identifier}`, { limit: 10, window: "1 m" });
  }
};
