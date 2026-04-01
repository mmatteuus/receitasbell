import { z } from 'zod';

function readEnv(name: string, aliases: string[] = []): string | undefined {
  const keys = [name, ...aliases];
  for (const key of keys) {
    const value = process.env[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return undefined;
}

function readBooleanEnv(name: string, aliases: string[] = []): boolean | undefined {
  const value = readEnv(name, aliases);
  if (value === undefined) return undefined;
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
}

const schema = z.object({
  NODE_ENV: z.string().optional(),

  APP_BASE_URL: z.string().min(1).optional(),
  ADMIN_API_SECRET: z.string().min(1).optional(),
  CRON_SECRET: z.string().min(1).optional(),

  // Supabase (Primary Database)
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(10).optional(),
  SUPABASE_ANON_KEY: z.string().min(10).optional(),

  // Email (Resend)
  RESEND_API_KEY: z.string().min(10).optional(),
  EMAIL_FROM: z.string().optional(),

  // Security
  APP_COOKIE_SECRET: z.string().min(1).optional(),
  ENCRYPTION_KEY: z.string().min(10).optional(),

  // Auth (Google)
  AUTH_SOCIAL_ENABLED: z.boolean().optional(),
  AUTH_SOCIAL_ALLOWED_TENANTS: z.string().optional(),
  GOOGLE_OAUTH_CLIENT_ID: z.string().optional(),
  GOOGLE_OAUTH_CLIENT_SECRET: z.string().optional(),
  GOOGLE_OAUTH_REDIRECT_URI: z.string().optional(),

  // Stripe (Payments)
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  // Observability
  SENTRY_DSN: z.string().optional(),

  // Redis (Rate limit / Cache)
  UPSTASH_REDIS_REST_URL: z.string().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
});

export const env = schema.parse({
  NODE_ENV: process.env.NODE_ENV,
  APP_BASE_URL: readEnv('APP_BASE_URL'),
  ADMIN_API_SECRET: readEnv('ADMIN_API_SECRET'),
  CRON_SECRET: readEnv('CRON_SECRET'),

  RESEND_API_KEY: readEnv('RESEND_API_KEY'),
  EMAIL_FROM: readEnv('EMAIL_FROM'),

  APP_COOKIE_SECRET: readEnv('APP_COOKIE_SECRET', ['ADMIN_SESSION_SECRET']),
  ENCRYPTION_KEY: readEnv('ENCRYPTION_KEY'),

  AUTH_SOCIAL_ENABLED: readBooleanEnv('AUTH_SOCIAL_ENABLED'),
  AUTH_SOCIAL_ALLOWED_TENANTS: readEnv('AUTH_SOCIAL_ALLOWED_TENANTS'),
  GOOGLE_OAUTH_CLIENT_ID: readEnv('GOOGLE_OAUTH_CLIENT_ID'),
  GOOGLE_OAUTH_CLIENT_SECRET: readEnv('GOOGLE_OAUTH_CLIENT_SECRET'),
  GOOGLE_OAUTH_REDIRECT_URI: readEnv('GOOGLE_OAUTH_REDIRECT_URI'),

  STRIPE_SECRET_KEY: readEnv('STRIPE_SECRET_KEY'),
  STRIPE_WEBHOOK_SECRET: readEnv('STRIPE_WEBHOOK_SECRET'),
  SENTRY_DSN: readEnv('SENTRY_DSN'),

  SUPABASE_URL: readEnv('SUPABASE_URL'),
  SUPABASE_SERVICE_ROLE_KEY: readEnv('SUPABASE_SERVICE_ROLE_KEY'),
  SUPABASE_ANON_KEY: readEnv('SUPABASE_ANON_KEY'),

  UPSTASH_REDIS_REST_URL: readEnv('UPSTASH_REDIS_REST_URL'),
  UPSTASH_REDIS_REST_TOKEN: readEnv('UPSTASH_REDIS_REST_TOKEN'),
});

export const isProd = (env.NODE_ENV ?? 'development') === 'production';

export function getOptionalEnv(name: string, aliases: string[] = []): string | null {
  return readEnv(name, aliases) ?? null;
}

export function validateCriticalEnv() {
  const required: Array<[string, string | undefined]> = [
    ['APP_BASE_URL', env.APP_BASE_URL],
    ['ADMIN_API_SECRET', env.ADMIN_API_SECRET],
    ['SUPABASE_URL', env.SUPABASE_URL],
    ['SUPABASE_ANON_KEY', env.SUPABASE_ANON_KEY],
    ['APP_COOKIE_SECRET', env.APP_COOKIE_SECRET],
    ['ENCRYPTION_KEY', env.ENCRYPTION_KEY],
  ];

  const missing = required
    .filter(([, value]) => !value || !String(value).trim())
    .map(([name]) => name);

  if (missing.length) {
    throw new Error(`Missing critical env vars: ${missing.join(', ')}`);
  }
}
