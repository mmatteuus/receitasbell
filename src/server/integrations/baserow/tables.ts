import { env } from "../../shared/env.js";

function reqId(name: string, value: string): number {
  const n = Number(value);
  if (!Number.isFinite(n)) throw new Error(`Invalid ${name}: ${value}`);
  return n;
}

export const baserowTables = {
  tenants: reqId("BASEROW_TABLE_TENANTS", env.BASEROW_TABLE_TENANTS),
  users: reqId("BASEROW_TABLE_USERS", env.BASEROW_TABLE_USERS),
  tenantUsers: reqId("BASEROW_TABLE_TENANT_USERS", env.BASEROW_TABLE_TENANT_USERS),

  recipes: reqId("BASEROW_TABLE_RECIPES", env.BASEROW_TABLE_RECIPES),
  categories: reqId("BASEROW_TABLE_CATEGORIES", env.BASEROW_TABLE_CATEGORIES),
  settings: reqId("BASEROW_TABLE_SETTINGS", env.BASEROW_TABLE_SETTINGS),

  paymentOrders: reqId("BASEROW_TABLE_PAYMENT_ORDERS", env.BASEROW_TABLE_PAYMENT_ORDERS),
  paymentEvents: reqId("BASEROW_TABLE_PAYMENT_EVENTS", env.BASEROW_TABLE_PAYMENT_EVENTS),
  recipePurchases: reqId("BASEROW_TABLE_RECIPE_PURCHASES", env.BASEROW_TABLE_RECIPE_PURCHASES),

  auditLogs: reqId("BASEROW_TABLE_AUDIT_LOGS", env.BASEROW_TABLE_AUDIT_LOGS),

  sessions: reqId("BASEROW_TABLE_SESSIONS", env.BASEROW_TABLE_SESSIONS),
  magicLinks: reqId("BASEROW_TABLE_MAGIC_LINKS", env.BASEROW_TABLE_MAGIC_LINKS),
};
