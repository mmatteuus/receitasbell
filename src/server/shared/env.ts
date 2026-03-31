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

  BASEROW_API_URL: z.string().optional(),
  BASEROW_API_TOKEN: z.string().min(10).optional(),
  BASEROW_TIMEOUT_MS: z.string().optional(),

  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(10).optional(),
  SUPABASE_ANON_KEY: z.string().min(10).optional(),

  RESEND_API_KEY: z.string().min(10).optional(),
  EMAIL_FROM: z.string().optional(),

  APP_COOKIE_SECRET: z.string().min(1).optional(),
  ENCRYPTION_KEY: z.string().min(10).optional(),

  // Baserow tables (IDs)
  BASEROW_TABLE_TENANTS: z.string().min(1).optional(),
  BASEROW_TABLE_USERS: z.string().min(1).optional(),
  BASEROW_TABLE_TENANT_USERS: z.string().min(1).optional(),

  BASEROW_TABLE_RECIPES: z.string().min(1).optional(),
  BASEROW_TABLE_CATEGORIES: z.string().min(1).optional(),
  BASEROW_TABLE_SETTINGS: z.string().min(1).optional(),

  BASEROW_TABLE_PAYMENT_ORDERS: z.string().min(1).optional(),
  BASEROW_TABLE_PAYMENT_EVENTS: z.string().min(1).optional(),
  BASEROW_TABLE_RECIPE_PURCHASES: z.string().min(1).optional(),

  BASEROW_TABLE_AUDIT_LOGS: z.string().min(1).optional(),

  BASEROW_TABLE_SESSIONS: z.string().min(1).optional(),
  BASEROW_TABLE_MAGIC_LINKS: z.string().min(1).optional(),

  AUTH_SOCIAL_ENABLED: z.boolean().optional(),
  AUTH_SOCIAL_ALLOWED_TENANTS: z.string().optional(),
  GOOGLE_OAUTH_CLIENT_ID: z.string().optional(),
  GOOGLE_OAUTH_CLIENT_SECRET: z.string().optional(),
  GOOGLE_OAUTH_REDIRECT_URI: z.string().optional(),
  BASEROW_TABLE_AUTH_OAUTH_STATES: z.string().min(1).optional(),
  BASEROW_TABLE_USER_IDENTITIES: z.string().min(1).optional(),

  // Recursos opcionais
  BASEROW_TABLE_FAVORITES: z.string().optional(),
  BASEROW_TABLE_COMMENTS: z.string().optional(),
  BASEROW_TABLE_RATINGS: z.string().optional(),
  BASEROW_TABLE_SHOPPING_LIST: z.string().optional(),
  BASEROW_TABLE_NEWSLETTER: z.string().optional(),
  BASEROW_TABLE_OAUTH_STATES: z.string().optional(),

  // Stripe Connect
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_CLIENT_ID: z.string().optional(),
  STRIPE_REDIRECT_URI: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  BASEROW_TABLE_STRIPE_CONNECTIONS: z.string().optional(),
  BASEROW_TABLE_STRIPE_OAUTH_STATES: z.string().optional(),
});

export const env = schema.parse({
  NODE_ENV: process.env.NODE_ENV,
  APP_BASE_URL: readEnv('APP_BASE_URL'),
  ADMIN_API_SECRET: readEnv('ADMIN_API_SECRET'),

  CRON_SECRET: readEnv('CRON_SECRET'),

  BASEROW_API_URL: readEnv('BASEROW_API_URL'),
  BASEROW_API_TOKEN: readEnv('BASEROW_API_TOKEN'),
  BASEROW_TIMEOUT_MS: readEnv('BASEROW_TIMEOUT_MS'),

  RESEND_API_KEY: readEnv('RESEND_API_KEY'),
  EMAIL_FROM: readEnv('EMAIL_FROM'),

  APP_COOKIE_SECRET: readEnv('APP_COOKIE_SECRET', ['ADMIN_SESSION_SECRET']),
  ENCRYPTION_KEY: readEnv('ENCRYPTION_KEY', ['APP_COOKIE_SECRET', 'ADMIN_SESSION_SECRET']),

  BASEROW_TABLE_TENANTS: readEnv('BASEROW_TABLE_TENANTS'),
  BASEROW_TABLE_USERS: readEnv('BASEROW_TABLE_USERS', ['BASEROW_TABLE_USER']),
  BASEROW_TABLE_TENANT_USERS: readEnv('BASEROW_TABLE_TENANT_USERS'),

  BASEROW_TABLE_RECIPES: readEnv('BASEROW_TABLE_RECIPES'),
  BASEROW_TABLE_CATEGORIES: readEnv('BASEROW_TABLE_CATEGORIES'),
  BASEROW_TABLE_SETTINGS: readEnv('BASEROW_TABLE_SETTINGS'),

  BASEROW_TABLE_PAYMENT_ORDERS: readEnv('BASEROW_TABLE_PAYMENT_ORDERS', ['BASEROW_TABLE_PAYMENTS']),
  BASEROW_TABLE_PAYMENT_EVENTS: readEnv('BASEROW_TABLE_PAYMENT_EVENTS', [
    'BASEROW_TABLE_PAYMENTS_EVENTS',
  ]),
  BASEROW_TABLE_RECIPE_PURCHASES: readEnv('BASEROW_TABLE_RECIPE_PURCHASES', [
    'BASEROW_TABLE_ENTITLEMENTS',
    'BASEROW_TABLE_PURCHASES',
  ]),

  BASEROW_TABLE_AUDIT_LOGS: readEnv('BASEROW_TABLE_AUDIT_LOGS'),

  BASEROW_TABLE_SESSIONS: readEnv('BASEROW_TABLE_SESSIONS'),
  BASEROW_TABLE_MAGIC_LINKS: readEnv('BASEROW_TABLE_MAGIC_LINKS'),

  AUTH_SOCIAL_ENABLED: readBooleanEnv('AUTH_SOCIAL_ENABLED'),
  AUTH_SOCIAL_ALLOWED_TENANTS: readEnv('AUTH_SOCIAL_ALLOWED_TENANTS'),
  GOOGLE_OAUTH_CLIENT_ID: readEnv('GOOGLE_OAUTH_CLIENT_ID'),
  GOOGLE_OAUTH_CLIENT_SECRET: readEnv('GOOGLE_OAUTH_CLIENT_SECRET'),
  GOOGLE_OAUTH_REDIRECT_URI: readEnv('GOOGLE_OAUTH_REDIRECT_URI'),
  BASEROW_TABLE_AUTH_OAUTH_STATES: readEnv('BASEROW_TABLE_AUTH_OAUTH_STATES'),
  BASEROW_TABLE_USER_IDENTITIES: readEnv('BASEROW_TABLE_USER_IDENTITIES'),

  BASEROW_TABLE_FAVORITES: readEnv('BASEROW_TABLE_FAVORITES'),
  BASEROW_TABLE_COMMENTS: readEnv('BASEROW_TABLE_COMMENTS'),
  BASEROW_TABLE_RATINGS: readEnv('BASEROW_TABLE_RATINGS'),
  BASEROW_TABLE_SHOPPING_LIST: readEnv('BASEROW_TABLE_SHOPPING_LIST'),
  BASEROW_TABLE_NEWSLETTER: readEnv('BASEROW_TABLE_NEWSLETTER'),
  BASEROW_TABLE_OAUTH_STATES: readEnv('BASEROW_TABLE_OAUTH_STATES'),

  STRIPE_SECRET_KEY: readEnv('STRIPE_SECRET_KEY'),
  STRIPE_CLIENT_ID: readEnv('STRIPE_CLIENT_ID'),
  STRIPE_REDIRECT_URI: readEnv('STRIPE_REDIRECT_URI'),
  STRIPE_WEBHOOK_SECRET: readEnv('STRIPE_WEBHOOK_SECRET'),
  BASEROW_TABLE_STRIPE_CONNECTIONS: readEnv('BASEROW_TABLE_STRIPE_CONNECTIONS'),
  BASEROW_TABLE_STRIPE_OAUTH_STATES: readEnv('BASEROW_TABLE_STRIPE_OAUTH_STATES'),

  SUPABASE_URL: readEnv('SUPABASE_URL'),
  SUPABASE_SERVICE_ROLE_KEY: readEnv('SUPABASE_SERVICE_ROLE_KEY'),
  SUPABASE_ANON_KEY: readEnv('SUPABASE_ANON_KEY'),
});

export const isProd = (env.NODE_ENV ?? 'development') === 'production';

export function getOptionalEnv(name: string, aliases: string[] = []): string | null {
  return readEnv(name, aliases) ?? null;
}

export function validateCriticalEnv() {
  const required: Array<[string, string | undefined]> = [
    ['APP_BASE_URL', env.APP_BASE_URL],
    ['ADMIN_API_SECRET', env.ADMIN_API_SECRET],
    ['CRON_SECRET', env.CRON_SECRET],
    ['BASEROW_API_TOKEN', env.BASEROW_API_TOKEN],
    ['APP_COOKIE_SECRET', env.APP_COOKIE_SECRET],
    ['ENCRYPTION_KEY', env.ENCRYPTION_KEY],
    ['BASEROW_TABLE_TENANTS', env.BASEROW_TABLE_TENANTS],
    ['BASEROW_TABLE_USERS', env.BASEROW_TABLE_USERS],
    ['BASEROW_TABLE_RECIPES', env.BASEROW_TABLE_RECIPES],
    ['BASEROW_TABLE_CATEGORIES', env.BASEROW_TABLE_CATEGORIES],
    ['BASEROW_TABLE_SETTINGS', env.BASEROW_TABLE_SETTINGS],
    ['BASEROW_TABLE_PAYMENT_ORDERS', env.BASEROW_TABLE_PAYMENT_ORDERS],
    ['BASEROW_TABLE_PAYMENT_EVENTS', env.BASEROW_TABLE_PAYMENT_EVENTS],
    ['BASEROW_TABLE_RECIPE_PURCHASES', env.BASEROW_TABLE_RECIPE_PURCHASES],
    ['BASEROW_TABLE_AUDIT_LOGS', env.BASEROW_TABLE_AUDIT_LOGS],
    ['BASEROW_TABLE_MAGIC_LINKS', env.BASEROW_TABLE_MAGIC_LINKS],
  ];

  const missing = required
    .filter(([, value]) => !value || !String(value).trim())
    .map(([name]) => name);

  if (missing.length) {
    throw new Error(`Missing critical env vars: ${missing.join(', ')}`);
  }
}

export async function getStripeAppEnvAsync(_tenantId: string) {
  const secretKey = getOptionalEnv('STRIPE_SECRET_KEY') || env.STRIPE_SECRET_KEY || '';
  const clientId = getOptionalEnv('STRIPE_CLIENT_ID') || env.STRIPE_CLIENT_ID || '';
  const redirectUri =
    getOptionalEnv('STRIPE_REDIRECT_URI') ||
    env.STRIPE_REDIRECT_URI ||
    `${(env.APP_BASE_URL || '').replace(/\/+$/, '')}/api/stripe/callback`;

  if (!secretKey || !clientId) {
    throw new Error('Stripe env vars ausentes (STRIPE_SECRET_KEY / STRIPE_CLIENT_ID).');
  }
  return { secretKey, clientId, redirectUri };
}
