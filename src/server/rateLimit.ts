import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

type RateLimitResult = {
  success: boolean;
  remaining: number;
  resetAfter: number;
};

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const LIMIT = 5;
const WINDOW_SECONDS = 60;

let upstashLimiter: Ratelimit | null = null;
if (UPSTASH_URL && UPSTASH_TOKEN) {
  const redis = new Redis({ url: UPSTASH_URL, token: UPSTASH_TOKEN });
  upstashLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(LIMIT, "1 m"),
  });
}

const memoryStore = new Map<string, { count: number; windowStart: number; blockedUntil?: number }>();

function getMemoryKeyState(key: string) {
  const now = Date.now();
  const entry = memoryStore.get(key);
  if (!entry || now - entry.windowStart > WINDOW_SECONDS * 1000) {
    return { count: 0, windowStart: now, blockedUntil: undefined };
  }
  return entry;
}

function setMemoryKeyState(key: string, state: { count: number; windowStart: number; blockedUntil?: number }) {
  memoryStore.set(key, state);
}

function consumeMemoryLimit(key: string): RateLimitResult {
  const now = Date.now();
  const state = getMemoryKeyState(key);

  if (state.blockedUntil && state.blockedUntil > now) {
    return {
      success: false,
      remaining: 0,
      resetAfter: Math.ceil((state.blockedUntil - now) / 1000),
    };
  }

  const nextCount = state.count + 1;
  const resetAfter = Math.ceil((state.windowStart + WINDOW_SECONDS * 1000 - now) / 1000);
  if (nextCount > LIMIT) {
    const blockedUntil = now + WINDOW_SECONDS * 1000;
    state.blockedUntil = blockedUntil;
    state.count = 0;
    state.windowStart = now;
    setMemoryKeyState(key, state);
    return {
      success: false,
      remaining: 0,
      resetAfter: WINDOW_SECONDS,
    };
  }

  state.count = nextCount;
  setMemoryKeyState(key, state);

  return {
    success: true,
    remaining: LIMIT - nextCount,
    resetAfter: resetAfter > 0 ? resetAfter : WINDOW_SECONDS,
  };
}

export async function consumeAdminRateLimit(key: string): Promise<RateLimitResult> {
  if (upstashLimiter) {
    const result = await upstashLimiter.limit(key);
    return {
      success: result.success,
      remaining: result.remaining ?? 0,
      resetAfter: result.reset ? Math.max(1, Math.ceil((result.reset - Date.now()) / 1000)) : WINDOW_SECONDS,
    };
  }

  return consumeMemoryLimit(key);
}
