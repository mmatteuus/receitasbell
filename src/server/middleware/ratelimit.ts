import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { env } from '../shared/env.js';

// Inicializar cliente Redis
const redis = new Redis({
  url: env.UPSTASH_REDIS_REST_URL,
  token: env.UPSTASH_REDIS_REST_TOKEN,
});

/**
 * Rate limiters para diferentes tipos de requisições
 */

// Login: 5 tentativas em 15 minutos
export const loginRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '15 m'),
  analytics: true,
  prefix: 'ratelimit:login',
});

// Esqueci senha: 3 tentativas em 1 hora
export const passwordResetRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, '1 h'),
  analytics: true,
  prefix: 'ratelimit:password-reset',
});

// Pagamento/Checkout: 10 requisições em 1 minuto
export const paymentRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 m'),
  analytics: true,
  prefix: 'ratelimit:payment',
});

// Webhook Stripe: 100 requisições em 1 minuto (mais permissivo)
export const webhookRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1 m'),
  analytics: true,
  prefix: 'ratelimit:webhook',
});

// API geral: 60 requisições em 1 minuto por IP
export const apiRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, '1 m'),
  analytics: true,
  prefix: 'ratelimit:api',
});

/**
 * Interface para resposta de rate limit
 */
export interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: number;
  retryAfter?: number;
}

/**
 * Função para verificar rate limit
 * @param limiter - Instância do Ratelimit
 * @param identifier - Identificador único (email, IP, etc)
 * @returns RateLimitResult
 */
export async function checkRateLimit(
  limiter: Ratelimit,
  identifier: string
): Promise<RateLimitResult> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (limiter.limit(identifier) as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pending = (result?.pending as any)?.[0] || 0;

    return {
      success: result.success,
      remaining: result.remaining,
      reset: pending,
      retryAfter: result.success ? undefined : Math.ceil(pending / 1000),
    };
  } catch (error) {
    console.error('Rate limit check failed:', error);
    // Em caso de erro, permitir requisição (fail-open para não quebrar app)
    return {
      success: true,
      remaining: -1,
      reset: 0,
    };
  }
}

/**
 * Helper para obter identificador de cliente
 * Prioridade: email > IP forwarded > IP direto
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getClientIdentifier(request: any, email?: string): string {
  if (email) return email;

  // X-Forwarded-For é usado por proxies (Vercel, CloudFlare, etc)
  const forwarded = request.headers?.['x-forwarded-for'];
  if (forwarded) {
    // Pode conter múltiplos IPs, pegar o primeiro
    return typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : forwarded[0];
  }

  // Fallback para IP direto
  return request.socket?.remoteAddress || 'unknown';
}

/**
 * Middleware para validar rate limit
 * Retorna true se permitido, false se bloqueado
 */
export async function validateRateLimit(
  limiter: Ratelimit,
  identifier: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  response?: any
): Promise<boolean> {
  const result = await checkRateLimit(limiter, identifier);

  if (!result.success && response) {
    // Responder com 429 Too Many Requests
    response.setHeader('X-RateLimit-Remaining', result.remaining);
    response.setHeader('Retry-After', result.retryAfter || 60);
    response.status(429).json({
      error: 'Too many requests',
      message: 'Please try again later',
      retryAfter: result.retryAfter,
    });
  }

  return result.success;
}
