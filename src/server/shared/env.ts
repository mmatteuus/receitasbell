import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.string().optional(),

  APP_BASE_URL: z.string().min(1),

  CRON_SECRET: z.string().min(16),

  BASEROW_API_URL: z.string().optional(),
  BASEROW_API_TOKEN: z.string().min(10),

  RESEND_API_KEY: z.string().min(10),
  EMAIL_FROM: z.string().optional(),

  APP_COOKIE_SECRET: z.string().min(32),

  MP_ACCESS_TOKEN: z.string().min(10),
  MP_WEBHOOK_SECRET: z.string().min(10),

  // Baserow tables (IDs)
  BASEROW_TABLE_TENANTS: z.string().min(1),
  BASEROW_TABLE_USERS: z.string().min(1),
  BASEROW_TABLE_TENANT_USERS: z.string().min(1),

  BASEROW_TABLE_RECIPES: z.string().min(1),
  BASEROW_TABLE_CATEGORIES: z.string().min(1),
  BASEROW_TABLE_SETTINGS: z.string().min(1),

  BASEROW_TABLE_PAYMENT_ORDERS: z.string().min(1),
  BASEROW_TABLE_PAYMENT_EVENTS: z.string().min(1),
  BASEROW_TABLE_RECIPE_PURCHASES: z.string().min(1),

  BASEROW_TABLE_AUDIT_LOGS: z.string().min(1),

  BASEROW_TABLE_SESSIONS: z.string().min(1),
  BASEROW_TABLE_MAGIC_LINKS: z.string().min(1),
});

export const env = schema.parse({
  NODE_ENV: process.env.NODE_ENV,
  APP_BASE_URL: process.env.APP_BASE_URL,

  CRON_SECRET: process.env.CRON_SECRET,

  BASEROW_API_URL: process.env.BASEROW_API_URL,
  BASEROW_API_TOKEN: process.env.BASEROW_API_TOKEN,

  RESEND_API_KEY: process.env.RESEND_API_KEY,
  EMAIL_FROM: process.env.EMAIL_FROM,

  APP_COOKIE_SECRET: process.env.APP_COOKIE_SECRET,

  MP_ACCESS_TOKEN: process.env.MP_ACCESS_TOKEN,
  MP_WEBHOOK_SECRET: process.env.MP_WEBHOOK_SECRET,

  BASEROW_TABLE_TENANTS: process.env.BASEROW_TABLE_TENANTS,
  BASEROW_TABLE_USERS: process.env.BASEROW_TABLE_USERS,
  BASEROW_TABLE_TENANT_USERS: process.env.BASEROW_TABLE_TENANT_USERS,

  BASEROW_TABLE_RECIPES: process.env.BASEROW_TABLE_RECIPES,
  BASEROW_TABLE_CATEGORIES: process.env.BASEROW_TABLE_CATEGORIES,
  BASEROW_TABLE_SETTINGS: process.env.BASEROW_TABLE_SETTINGS,

  BASEROW_TABLE_PAYMENT_ORDERS: process.env.BASEROW_TABLE_PAYMENT_ORDERS,
  BASEROW_TABLE_PAYMENT_EVENTS: process.env.BASEROW_TABLE_PAYMENT_EVENTS,
  BASEROW_TABLE_RECIPE_PURCHASES: process.env.BASEROW_TABLE_RECIPE_PURCHASES,

  BASEROW_TABLE_AUDIT_LOGS: process.env.BASEROW_TABLE_AUDIT_LOGS,

  BASEROW_TABLE_SESSIONS: process.env.BASEROW_TABLE_SESSIONS,
  BASEROW_TABLE_MAGIC_LINKS: process.env.BASEROW_TABLE_MAGIC_LINKS,
});

export const isProd = (env.NODE_ENV ?? "development") === "production";
