import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.string().optional(),
  APP_BASE_URL: z.string().url(),
  CRON_SECRET: z.string().min(16),

  BASEROW_API_URL: z.string().url(),
  BASEROW_API_TOKEN: z.string().min(10),

  // tabelas (id numérico como string)
  BASEROW_TABLE_TENANTS: z.string().min(1),
  BASEROW_TABLE_USERS: z.string().min(1),
  BASEROW_TABLE_USER_SESSIONS: z.string().min(1),
  BASEROW_TABLE_AUTH_TOKENS: z.string().min(1),

  // domínio app
  BASEROW_TABLE_RECIPES: z.string().min(1),
  BASEROW_TABLE_CATEGORIES: z.string().min(1),
  BASEROW_TABLE_SETTINGS: z.string().min(1),
  BASEROW_TABLE_COMMENTS: z.string().min(1),
  BASEROW_TABLE_RATINGS: z.string().min(1),
  BASEROW_TABLE_FAVORITES: z.string().min(1),
  BASEROW_TABLE_SHOPPING_LIST: z.string().min(1),
  BASEROW_TABLE_NEWSLETTER: z.string().min(1),

  // usuários e acesso
  BASEROW_TABLE_TENANT_USERS: z.string().min(1),
  BASEROW_TABLE_ENTITLEMENTS: z.string().min(1),
  BASEROW_TABLE_OAUTH_STATES: z.string().min(1),

  // pagamentos
  BASEROW_TABLE_PAYMENT_ORDERS: z.string().min(1),
  BASEROW_TABLE_PAYMENT_EVENTS: z.string().min(1),
  BASEROW_TABLE_RECIPE_PURCHASES: z.string().min(1),

  // auditoria
  BASEROW_TABLE_AUDIT_LOGS: z.string().min(1),

  // Mercado Pago (mínimo)
  MP_ACCESS_TOKEN: z.string().min(10),
  MP_WEBHOOK_SECRET: z.string().min(10).optional(), // Optional initially as per prompt note or schema
});

// Mercado Pago Webhook secret check (adding a fallback or optional handling if needed)
const validatedData = {
  NODE_ENV: process.env.NODE_ENV,
  APP_BASE_URL: process.env.APP_BASE_URL,
  CRON_SECRET: process.env.CRON_SECRET,

  BASEROW_API_URL: process.env.BASEROW_API_URL,
  BASEROW_API_TOKEN: process.env.BASEROW_API_TOKEN,

  BASEROW_TABLE_TENANTS: process.env.BASEROW_TABLE_TENANTS,
  BASEROW_TABLE_USERS: process.env.BASEROW_TABLE_USERS,
  BASEROW_TABLE_USER_SESSIONS: process.env.BASEROW_TABLE_USER_SESSIONS,
  BASEROW_TABLE_AUTH_TOKENS: process.env.BASEROW_TABLE_AUTH_TOKENS,

  BASEROW_TABLE_RECIPES: process.env.BASEROW_TABLE_RECIPES,
  BASEROW_TABLE_CATEGORIES: process.env.BASEROW_TABLE_CATEGORIES,
  BASEROW_TABLE_SETTINGS: process.env.BASEROW_TABLE_SETTINGS,
  BASEROW_TABLE_COMMENTS: process.env.BASEROW_TABLE_COMMENTS,
  BASEROW_TABLE_RATINGS: process.env.BASEROW_TABLE_RATINGS,
  BASEROW_TABLE_FAVORITES: process.env.BASEROW_TABLE_FAVORITES,
  BASEROW_TABLE_SHOPPING_LIST: process.env.BASEROW_TABLE_SHOPPING_LIST,
  BASEROW_TABLE_NEWSLETTER: process.env.BASEROW_TABLE_NEWSLETTER,

  BASEROW_TABLE_TENANT_USERS: process.env.BASEROW_TABLE_TENANT_USERS,
  BASEROW_TABLE_ENTITLEMENTS: process.env.BASEROW_TABLE_ENTITLEMENTS,
  BASEROW_TABLE_OAUTH_STATES: process.env.BASEROW_TABLE_OAUTH_STATES,

  BASEROW_TABLE_PAYMENT_ORDERS: process.env.BASEROW_TABLE_PAYMENT_ORDERS,
  BASEROW_TABLE_PAYMENT_EVENTS: process.env.BASEROW_TABLE_PAYMENT_EVENTS,
  BASEROW_TABLE_RECIPE_PURCHASES: process.env.BASEROW_TABLE_RECIPE_PURCHASES,

  BASEROW_TABLE_AUDIT_LOGS: process.env.BASEROW_TABLE_AUDIT_LOGS,

  MP_ACCESS_TOKEN: process.env.MP_ACCESS_TOKEN,
  MP_WEBHOOK_SECRET: process.env.MP_WEBHOOK_SECRET,
};

export const env = schema.parse(validatedData);

export const isProd = (env.NODE_ENV ?? 'development') === 'production';
