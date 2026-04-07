import { env } from "./env.js";

type CacheOptions = {
  ttlSeconds?: number;
};

const localCache = new Map<string, { value: any; expiresAt: number }>();

export const cache = {
  async get<T>(key: string): Promise<T | null> {
    // 1. Check local memory first (L1)
    const local = localCache.get(key);
    if (local && local.expiresAt > Date.now()) {
      return local.value as T;
    }

    // 2. Check Redis (L2) if configured
    if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) {
      try {
        const res = await fetch(`${env.UPSTASH_REDIS_REST_URL}/get/${key}`, {
          headers: {
            Authorization: `Bearer ${env.UPSTASH_REDIS_REST_TOKEN}`,
          },
        });
        const data = await res.json();
        if (data.result) {
          const value = JSON.parse(data.result) as T;
          // Hydrate local
          this.setLocal(key, value, 60); // Cache localmente por 1 minuto redundante
          return value;
        }
      } catch (err) {
        console.warn("[Cache] Redis get error:", err);
      }
    }

    return null;
  },

  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<void> {
    const ttl = options.ttlSeconds || 300; // Default 5 min
    const expiresAt = Date.now() + ttl * 1000;

    // 1. Set local
    localCache.set(key, { value, expiresAt });

    // 2. Set Redis if configured
    if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) {
      try {
        await fetch(`${env.UPSTASH_REDIS_REST_URL}/set/${key}/${ttl}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${env.UPSTASH_REDIS_REST_TOKEN}`,
          },
          body: JSON.stringify(value),
        });
      } catch (err) {
        console.warn("[Cache] Redis set error:", err);
      }
    }
  },

  setLocal(key: string, value: any, ttlSeconds: number) {
    localCache.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  },

  async delete(key: string): Promise<void> {
    localCache.delete(key);
    if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) {
      try {
        await fetch(`${env.UPSTASH_REDIS_REST_URL}/del/${key}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${env.UPSTASH_REDIS_REST_TOKEN}`,
          },
        });
      } catch (err) {
        console.warn("[Cache] Redis del error:", err);
      }
    }
  }
};
