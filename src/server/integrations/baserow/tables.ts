import { env } from '../../shared/env.js';

function requireTable(name: string, value: string): number {
  if (!value || !value.trim()) {
    throw new Error(`Missing Baserow table id for ${name}`);
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid Baserow table id for ${name}: ${value}`);
  }
  return parsed;
}

export const baserowTables = {
  tenants: requireTable('BASEROW_TABLE_TENANTS', env.BASEROW_TABLE_TENANTS),
  users: requireTable('BASEROW_TABLE_USERS', env.BASEROW_TABLE_USERS),
  tenantUsers: requireTable('BASEROW_TABLE_TENANT_USERS', env.BASEROW_TABLE_TENANT_USERS),
  recipes: requireTable('BASEROW_TABLE_RECIPES', env.BASEROW_TABLE_RECIPES),
  categories: requireTable('BASEROW_TABLE_CATEGORIES', env.BASEROW_TABLE_CATEGORIES),
  settings: requireTable('BASEROW_TABLE_SETTINGS', env.BASEROW_TABLE_SETTINGS),
  paymentOrders: requireTable('BASEROW_TABLE_PAYMENT_ORDERS', env.BASEROW_TABLE_PAYMENT_ORDERS),
  paymentEvents: requireTable('BASEROW_TABLE_PAYMENT_EVENTS', env.BASEROW_TABLE_PAYMENT_EVENTS),
  recipePurchases: requireTable('BASEROW_TABLE_RECIPE_PURCHASES', env.BASEROW_TABLE_RECIPE_PURCHASES),
  auditLogs: requireTable('BASEROW_TABLE_AUDIT_LOGS', env.BASEROW_TABLE_AUDIT_LOGS),
  comments: requireTable('BASEROW_TABLE_COMMENTS', env.BASEROW_TABLE_COMMENTS),
  favorites: requireTable('BASEROW_TABLE_FAVORITES', env.BASEROW_TABLE_FAVORITES),
  newsletter: requireTable('BASEROW_TABLE_NEWSLETTER', env.BASEROW_TABLE_NEWSLETTER),
  shoppingList: requireTable('BASEROW_TABLE_SHOPPING_LIST', env.BASEROW_TABLE_SHOPPING_LIST),
  ratings: requireTable('BASEROW_TABLE_RATINGS', env.BASEROW_TABLE_RATINGS),
  entitlements: requireTable('BASEROW_TABLE_ENTITLEMENTS', env.BASEROW_TABLE_ENTITLEMENTS),
  oauthStates: requireTable('BASEROW_TABLE_OAUTH_STATES', env.BASEROW_TABLE_OAUTH_STATES),
  userSessions: requireTable('BASEROW_TABLE_USER_SESSIONS', env.BASEROW_TABLE_USER_SESSIONS),
  authTokens: requireTable('BASEROW_TABLE_AUTH_TOKENS', env.BASEROW_TABLE_AUTH_TOKENS),
};
