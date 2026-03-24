import { env } from "../../shared/env.js";

function requireTable(name: string, value: string): number {
  if (!value || !value.trim()) throw new Error(`Missing Baserow table id for ${name}`);
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw new Error(`Invalid Baserow table id for ${name}: ${value}`);
  return parsed;
}

/**
 * IDs de tabelas Baserow.
 * Suporta tanto o padrão 10/10 (lowercase) quanto o legado (UPPERCASE).
 */
export const baserowTables = {
  // Padrão 10/10 (Novo)
  tenants: requireTable("BASEROW_TABLE_TENANTS", env.BASEROW_TABLE_TENANTS),
  users: requireTable("BASEROW_TABLE_USERS", env.BASEROW_TABLE_USERS),
  tenantUsers: requireTable("BASEROW_TABLE_TENANT_USERS", env.BASEROW_TABLE_TENANT_USERS),
  recipes: requireTable("BASEROW_TABLE_RECIPES", env.BASEROW_TABLE_RECIPES),
  categories: requireTable("BASEROW_TABLE_CATEGORIES", env.BASEROW_TABLE_CATEGORIES),
  settings: requireTable("BASEROW_TABLE_SETTINGS", env.BASEROW_TABLE_SETTINGS),
  paymentOrders: requireTable("BASEROW_TABLE_PAYMENT_ORDERS", env.BASEROW_TABLE_PAYMENT_ORDERS),
  paymentEvents: requireTable("BASEROW_TABLE_PAYMENT_EVENTS", env.BASEROW_TABLE_PAYMENT_EVENTS),
  recipePurchases: requireTable("BASEROW_TABLE_RECIPE_PURCHASES", env.BASEROW_TABLE_RECIPE_PURCHASES),
  auditLogs: requireTable("BASEROW_TABLE_AUDIT_LOGS", env.BASEROW_TABLE_AUDIT_LOGS),
  comments: requireTable("BASEROW_TABLE_COMMENTS", env.BASEROW_TABLE_COMMENTS),
  favorites: requireTable("BASEROW_TABLE_FAVORITES", env.BASEROW_TABLE_FAVORITES),
  newsletter: requireTable("BASEROW_TABLE_NEWSLETTER", env.BASEROW_TABLE_NEWSLETTER),
  shoppingList: requireTable("BASEROW_TABLE_SHOPPING_LIST", env.BASEROW_TABLE_SHOPPING_LIST),
  ratings: requireTable("BASEROW_TABLE_RATINGS", env.BASEROW_TABLE_RATINGS),
  entitlements: requireTable("BASEROW_TABLE_ENTITLEMENTS", env.BASEROW_TABLE_ENTITLEMENTS),
  oauthStates: requireTable("BASEROW_TABLE_OAUTH_STATES", env.BASEROW_TABLE_OAUTH_STATES),
  
  // Novos (Fase 2)
  sessions: requireTable("BASEROW_TABLE_SESSIONS", (process.env.BASEROW_TABLE_SESSIONS ?? "").trim()),
  magicLinks: requireTable("BASEROW_TABLE_MAGIC_LINKS", (process.env.BASEROW_TABLE_MAGIC_LINKS ?? "").trim()),

  // Compatibilidade Legada (UPPERCASE)
  TENANTS: requireTable("BASEROW_TABLE_TENANTS", env.BASEROW_TABLE_TENANTS),
  USERS: requireTable("BASEROW_TABLE_USERS", env.BASEROW_TABLE_USERS),
  TENANT_USERS: requireTable("BASEROW_TABLE_TENANT_USERS", env.BASEROW_TABLE_TENANT_USERS),
  RECIPES: requireTable("BASEROW_TABLE_RECIPES", env.BASEROW_TABLE_RECIPES),
  CATEGORIES: requireTable("BASEROW_TABLE_CATEGORIES", env.BASEROW_TABLE_CATEGORIES),
  SETTINGS: requireTable("BASEROW_TABLE_SETTINGS", env.BASEROW_TABLE_SETTINGS),
  PAYMENTS: requireTable("BASEROW_TABLE_PAYMENT_ORDERS", env.BASEROW_TABLE_PAYMENT_ORDERS),
  PAYMENT_EVENTS: requireTable("BASEROW_TABLE_PAYMENT_EVENTS", env.BASEROW_TABLE_PAYMENT_EVENTS),
  RECIPE_PURCHASES: requireTable("BASEROW_TABLE_RECIPE_PURCHASES", env.BASEROW_TABLE_RECIPE_PURCHASES),
  AUDIT_LOGS: requireTable("BASEROW_TABLE_AUDIT_LOGS", env.BASEROW_TABLE_AUDIT_LOGS),
  COMMENTS: requireTable("BASEROW_TABLE_COMMENTS", env.BASEROW_TABLE_COMMENTS),
  FAVORITES: requireTable("BASEROW_TABLE_FAVORITES", env.BASEROW_TABLE_FAVORITES),
  NEWSLETTER: requireTable("BASEROW_TABLE_NEWSLETTER", env.BASEROW_TABLE_NEWSLETTER),
  SHOPPING_LIST: requireTable("BASEROW_TABLE_SHOPPING_LIST", env.BASEROW_TABLE_SHOPPING_LIST),
  RATINGS: requireTable("BASEROW_TABLE_RATINGS", env.BASEROW_TABLE_RATINGS),
  ENTITLEMENTS: requireTable("BASEROW_TABLE_ENTITLEMENTS", env.BASEROW_TABLE_ENTITLEMENTS),
  OAUTH_STATES: requireTable("BASEROW_TABLE_OAUTH_STATES", env.BASEROW_TABLE_OAUTH_STATES),
};

export const BASEROW_TABLES = baserowTables;
