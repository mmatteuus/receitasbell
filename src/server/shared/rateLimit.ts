import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { env } from "./env.js";

// Singleton do Redis
const redis = (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN)
  ? new Redis({
      url: env.UPSTASH_REDIS_REST_URL,
      token: env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

// Rate Limiters por categoria
// 1. Geral (fallback)
export const globalRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100, "1 m"), // 100 req/min
      analytics: true,
      prefix: "ratelimit:global",
    })
  : null;

// 2. Auth (Mais rigoroso para evitar brute-force)
export const authRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "1 m"), // 5 tentativas/min
      analytics: true,
      prefix: "ratelimit:auth",
    })
  : null;

// 3. Admin (Para evitar abusos em dashboards pesados)
export const adminRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(50, "1 m"),
      analytics: true,
      prefix: "ratelimit:admin",
    })
  : null;

/**
 * Helper para verificar rate limit
 */
export async function checkRateLimit(
  limiter: Ratelimit | null,
  identifier: string
): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  if (!limiter) {
    return { success: true, limit: 0, remaining: 0, reset: 0 };
  }

  const result = await limiter.limit(identifier);
  return {
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
  };
}
