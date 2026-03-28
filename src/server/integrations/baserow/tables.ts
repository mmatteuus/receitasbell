// src/server/integrations/baserow/tables.ts
import { env } from "../../shared/env.js";

function reqId(name: string, value: string | undefined): number {
  const n = Number(value);
  if (!Number.isFinite(n)) {
    throw new Error(`Invalid table ID for ${name}: ${value}. Certifique-se de configurar as variáveis de ambiente.`);
  }
  return n;
}

function optionalId(name: string, value: string | undefined): number | undefined {
  if (typeof value !== "string" || !value.trim()) return undefined;
  return reqId(name, value);
}

export const baserowTables = {
  get tenants() {
    return reqId("BASEROW_TABLE_TENANTS", env.BASEROW_TABLE_TENANTS);
  },
  get users() {
    return reqId("BASEROW_TABLE_USERS", env.BASEROW_TABLE_USERS);
  },
  get tenantUsers() {
    return optionalId("BASEROW_TABLE_TENANT_USERS", env.BASEROW_TABLE_TENANT_USERS);
  },
  get recipes() {
    return reqId("BASEROW_TABLE_RECIPES", env.BASEROW_TABLE_RECIPES);
  },
  get categories() {
    return reqId("BASEROW_TABLE_CATEGORIES", env.BASEROW_TABLE_CATEGORIES);
  },
  get settings() {
    return reqId("BASEROW_TABLE_SETTINGS", env.BASEROW_TABLE_SETTINGS);
  },
  get paymentOrders() {
    return reqId("BASEROW_TABLE_PAYMENT_ORDERS", env.BASEROW_TABLE_PAYMENT_ORDERS);
  },
  get paymentEvents() {
    return reqId("BASEROW_TABLE_PAYMENT_EVENTS", env.BASEROW_TABLE_PAYMENT_EVENTS);
  },
  get recipePurchases() {
    return reqId("BASEROW_TABLE_RECIPE_PURCHASES", env.BASEROW_TABLE_RECIPE_PURCHASES);
  },
  get auditLogs() {
    return reqId("BASEROW_TABLE_AUDIT_LOGS", env.BASEROW_TABLE_AUDIT_LOGS);
  },
  get sessions() {
    return reqId("BASEROW_TABLE_SESSIONS", env.BASEROW_TABLE_SESSIONS);
  },
  get magicLinks() {
    return reqId("BASEROW_TABLE_MAGIC_LINKS", env.BASEROW_TABLE_MAGIC_LINKS);
  },

  // Tabelas opcionais/extras
  get favorites() {
    return optionalId("BASEROW_TABLE_FAVORITES", env.BASEROW_TABLE_FAVORITES);
  },
  get comments() {
    return optionalId("BASEROW_TABLE_COMMENTS", env.BASEROW_TABLE_COMMENTS);
  },
  get ratings() {
    return optionalId("BASEROW_TABLE_RATINGS", env.BASEROW_TABLE_RATINGS);
  },
  get shoppingList() {
    return optionalId("BASEROW_TABLE_SHOPPING_LIST", env.BASEROW_TABLE_SHOPPING_LIST);
  },
  get newsletter() {
    return optionalId("BASEROW_TABLE_NEWSLETTER", env.BASEROW_TABLE_NEWSLETTER);
  },
  get oauthStates() {
    return optionalId("BASEROW_TABLE_OAUTH_STATES", env.BASEROW_TABLE_OAUTH_STATES);
  },
  get mpConnections() {
    return optionalId("BASEROW_TABLE_MP_CONNECTIONS", env.BASEROW_TABLE_MP_CONNECTIONS);
  },
} as const;

// Alias legado em UPPERCASE para compatibilidade
export const BASEROW_TABLES = {
  get TENANTS() {
    return baserowTables.tenants;
  },
  get USERS() {
    return baserowTables.users;
  },
  get TENANT_USERS() {
    return baserowTables.tenantUsers;
  },
  get RECIPES() {
    return baserowTables.recipes;
  },
  get CATEGORIES() {
    return baserowTables.categories;
  },
  get SETTINGS() {
    return baserowTables.settings;
  },
  get PAYMENT_ORDERS() {
    return baserowTables.paymentOrders;
  },
  get PAYMENT_EVENTS() {
    return baserowTables.paymentEvents;
  },
  get ENTITLEMENTS() {
    return baserowTables.recipePurchases;
  },
  get AUDIT_LOGS() {
    return baserowTables.auditLogs;
  },
  get SESSIONS() {
    return baserowTables.sessions;
  },
  get MAGIC_LINKS() {
    return baserowTables.magicLinks;
  },
  get FAVORITES() {
    return baserowTables.favorites;
  },
  get COMMENTS() {
    return baserowTables.comments;
  },
  get RATINGS() {
    return baserowTables.ratings;
  },
  get SHOPPING_LIST() {
    return baserowTables.shoppingList;
  },
  get NEWSLETTER() {
    return baserowTables.newsletter;
  },
  get OAUTH_STATES() {
    return baserowTables.oauthStates;
  },
  get MP_CONNECTIONS() {
    return baserowTables.mpConnections;
  },
} as const;
