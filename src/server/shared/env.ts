import { z } from "zod";

/**
 * Env loader com:
 * - validação mínima para runtime
 * - compatibilidade com nomes antigos (ex.: MERCADO_PAGO_* e ENCRYPTION_KEY)
 * - exports esperados por módulos atuais (ex.: getMercadoPagoAppEnvAsync)
 *
 * Importante: em produção, prefira nomes "MP_APP_*" e "MP_WEBHOOK_SECRET".
 */
const rawSchema = z.object({
  NODE_ENV: z.string().optional(),

  APP_BASE_URL: z.string().min(1),

  BASEROW_API_URL: z.string().optional(),
  BASEROW_API_TOKEN: z.string().min(1),

  CRON_SECRET: z.string().min(1),

  RESEND_API_KEY: z.string().min(1),
  EMAIL_FROM: z.string().optional(),

  // Sessão (fase 0 mantém compat)
  APP_COOKIE_SECRET: z.string().min(1),

  // Admin (será reduzido nas fases seguintes)
  ADMIN_API_SECRET: z.string().optional(),

  // MP Webhook: novo e compat
  MP_WEBHOOK_SECRET: z.string().optional(),
  MERCADO_PAGO_WEBHOOK_SECRET: z.string().optional(),
  MERCADO_PAGO_WEBHOOK_SIGNING_SECRET: z.string().optional(),

  // MP OAuth: novo e compat
  MP_APP_CLIENT_ID: z.string().optional(),
  MP_APP_CLIENT_SECRET: z.string().optional(),
  MP_APP_REDIRECT_URI: z.string().optional(),

  MERCADO_PAGO_CLIENT_ID: z.string().optional(),
  MERCADO_PAGO_CLIENT_SECRET: z.string().optional(),
  MERCADO_PAGO_REDIRECT_URI: z.string().optional(),

  // Crypto: novo e compat
  APP_ENCRYPTION_KEY: z.string().optional(),
  ENCRYPTION_KEY: z.string().optional(),

  // Tabelas Baserow: strings (convertidas onde necessário)
  BASEROW_TABLE_TENANTS: z.string().optional(),
  BASEROW_TABLE_USERS: z.string().optional(),
  BASEROW_TABLE_TENANT_USERS: z.string().optional(),
  BASEROW_TABLE_RECIPES: z.string().optional(),
  BASEROW_TABLE_CATEGORIES: z.string().optional(),
  BASEROW_TABLE_SETTINGS: z.string().optional(),

  BASEROW_TABLE_PAYMENT_ORDERS: z.string().optional(),
  BASEROW_TABLE_PAYMENTS: z.string().optional(), // legado

  BASEROW_TABLE_PAYMENT_EVENTS: z.string().optional(),
  BASEROW_TABLE_RECIPE_PURCHASES: z.string().optional(),
  BASEROW_TABLE_AUDIT_LOGS: z.string().optional(),
  BASEROW_TABLE_COMMENTS: z.string().optional(),
  BASEROW_TABLE_FAVORITES: z.string().optional(),
  BASEROW_TABLE_NEWSLETTER: z.string().optional(),
  BASEROW_TABLE_SHOPPING_LIST: z.string().optional(),
  BASEROW_TABLE_RATINGS: z.string().optional(),
  BASEROW_TABLE_ENTITLEMENTS: z.string().optional(),
  BASEROW_TABLE_OAUTH_STATES: z.string().optional(),
});

const raw = rawSchema.parse(process.env);

function requireValue(name: string, value: string | undefined) {
  if (!value || !String(value).trim()) throw new Error(`Missing required environment variable: ${name}`);
  return String(value).trim();
}

function firstDefined(...values: Array<string | undefined>) {
  for (const v of values) {
    if (v && String(v).trim()) return String(v).trim();
  }
  return undefined;
}

export const env = {
  NODE_ENV: raw.NODE_ENV || "development",

  APP_BASE_URL: requireValue("APP_BASE_URL", raw.APP_BASE_URL),

  BASEROW_API_URL: (raw.BASEROW_API_URL && raw.BASEROW_API_URL.trim()) || "https://api.baserow.io",
  BASEROW_API_TOKEN: requireValue("BASEROW_API_TOKEN", raw.BASEROW_API_TOKEN),

  CRON_SECRET: requireValue("CRON_SECRET", raw.CRON_SECRET),

  RESEND_API_KEY: requireValue("RESEND_API_KEY", raw.RESEND_API_KEY),
  EMAIL_FROM: (raw.EMAIL_FROM && raw.EMAIL_FROM.trim()) || "contato@receitasbell.com.br",

  APP_COOKIE_SECRET: requireValue("APP_COOKIE_SECRET", raw.APP_COOKIE_SECRET),

  ADMIN_API_SECRET: (raw.ADMIN_API_SECRET && raw.ADMIN_API_SECRET.trim()) || "",

  MP_WEBHOOK_SECRET: requireValue(
    "MP_WEBHOOK_SECRET",
    firstDefined(raw.MP_WEBHOOK_SECRET, raw.MERCADO_PAGO_WEBHOOK_SECRET, raw.MERCADO_PAGO_WEBHOOK_SIGNING_SECRET)
  ),

  MP_APP_CLIENT_ID: firstDefined(raw.MP_APP_CLIENT_ID, raw.MERCADO_PAGO_CLIENT_ID) || "",
  MP_APP_CLIENT_SECRET: firstDefined(raw.MP_APP_CLIENT_SECRET, raw.MERCADO_PAGO_CLIENT_SECRET) || "",
  MP_APP_REDIRECT_URI: firstDefined(raw.MP_APP_REDIRECT_URI, raw.MERCADO_PAGO_REDIRECT_URI) || "",

  APP_ENCRYPTION_KEY: firstDefined(raw.APP_ENCRYPTION_KEY, raw.ENCRYPTION_KEY) || "",

  // Baserow tables (strings aqui; tables.ts converte para number e valida)
  BASEROW_TABLE_TENANTS: raw.BASEROW_TABLE_TENANTS ?? "",
  BASEROW_TABLE_USERS: raw.BASEROW_TABLE_USERS ?? "",
  BASEROW_TABLE_TENANT_USERS: raw.BASEROW_TABLE_TENANT_USERS ?? "",
  BASEROW_TABLE_RECIPES: raw.BASEROW_TABLE_RECIPES ?? "",
  BASEROW_TABLE_CATEGORIES: raw.BASEROW_TABLE_CATEGORIES ?? "",
  BASEROW_TABLE_SETTINGS: raw.BASEROW_TABLE_SETTINGS ?? "",

  BASEROW_TABLE_PAYMENT_ORDERS: firstDefined(raw.BASEROW_TABLE_PAYMENT_ORDERS, raw.BASEROW_TABLE_PAYMENTS) ?? "",
  BASEROW_TABLE_PAYMENT_EVENTS: raw.BASEROW_TABLE_PAYMENT_EVENTS ?? "",
  BASEROW_TABLE_RECIPE_PURCHASES: raw.BASEROW_TABLE_RECIPE_PURCHASES ?? "",
  BASEROW_TABLE_AUDIT_LOGS: raw.BASEROW_TABLE_AUDIT_LOGS ?? "",
  BASEROW_TABLE_COMMENTS: raw.BASEROW_TABLE_COMMENTS ?? "",
  BASEROW_TABLE_FAVORITES: raw.BASEROW_TABLE_FAVORITES ?? "",
  BASEROW_TABLE_NEWSLETTER: raw.BASEROW_TABLE_NEWSLETTER ?? "",
  BASEROW_TABLE_SHOPPING_LIST: raw.BASEROW_TABLE_SHOPPING_LIST ?? "",
  BASEROW_TABLE_RATINGS: raw.BASEROW_TABLE_RATINGS ?? "",
  BASEROW_TABLE_ENTITLEMENTS: raw.BASEROW_TABLE_ENTITLEMENTS ?? "",
  BASEROW_TABLE_OAUTH_STATES: raw.BASEROW_TABLE_OAUTH_STATES ?? "",
};

/**
 * Export esperado por código atual de OAuth MP.
 * Nesta fase, retorna config global (não por tenant).
 */
export async function getMercadoPagoAppEnvAsync(_tenantId: string) {
  if (!env.MP_APP_CLIENT_ID || !env.MP_APP_CLIENT_SECRET || !env.MP_APP_REDIRECT_URI) {
    throw new Error(
      "Missing Mercado Pago OAuth env. Set MP_APP_CLIENT_ID/MP_APP_CLIENT_SECRET/MP_APP_REDIRECT_URI (or MERCADO_PAGO_* equivalents)."
    );
  }
  return {
    clientId: env.MP_APP_CLIENT_ID,
    clientSecret: env.MP_APP_CLIENT_SECRET,
    redirectUri: env.MP_APP_REDIRECT_URI,
  };
}

/**
 * Health check helper esperado por api/health.ts
 */
export function validateCriticalEnv() {
  // Revalida as críticas (lança erro se faltar)
  requireValue("APP_BASE_URL", env.APP_BASE_URL);
  requireValue("BASEROW_API_TOKEN", env.BASEROW_API_TOKEN);
  requireValue("CRON_SECRET", env.CRON_SECRET);
  requireValue("RESEND_API_KEY", env.RESEND_API_KEY);
  requireValue("APP_COOKIE_SECRET", env.APP_COOKIE_SECRET);
  requireValue("MP_WEBHOOK_SECRET", env.MP_WEBHOOK_SECRET);
}
