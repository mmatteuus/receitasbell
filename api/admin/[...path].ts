import type { VercelRequest, VercelResponse } from "@vercel/node";

import adminCategories from "../../api_handlers/admin/categories.js";
import adminEntitlements from "../../api_handlers/admin/entitlements.js";
import adminRecipes from "../../api_handlers/admin/recipes.js";
import adminSettings from "../../api_handlers/admin/settings.js";
import adminPayments from "../../api_handlers/admin/payments.js";
import adminPaymentById from "../../api_handlers/admin/payments/[id].js";
import adminPaymentNote from "../../api_handlers/admin/payments/[id]/note.js";
import adminPaymentSettings from "../../api_handlers/admin/payments/settings.js";
import adminMpConnect from "../../api_handlers/admin/mercadopago/connect.js";
import adminMpDisconnect from "../../api_handlers/admin/mercadopago/disconnect.js";
import adminAuthBootstrap from "../../api_handlers/admin/auth/bootstrap.js";
import adminAuthSession from "../../api_handlers/admin/auth/session.js";

type RouteHandler = (request: VercelRequest, response: VercelResponse) => Promise<unknown> | unknown;

function readPath(request: VercelRequest, prefix: string): string[] {
  const value = request.query.path;
  if (Array.isArray(value) && value.length > 0) {
    return value
      .map((part) => String(part).trim())
      .filter(Boolean);
  }
  if (typeof value === "string" && value.length > 0) {
    return value
      .split("/")
      .map((part) => part.trim())
      .filter(Boolean);
  }

  const pathname = (request.url || "").split("?")[0] || "";
  if (!pathname.startsWith(prefix)) return [];

  return pathname
    .slice(prefix.length)
    .split("/")
    .map((part) => part.trim())
    .filter(Boolean);
}

function setQueryParam(request: VercelRequest, key: string, value: string) {
  const query = (request.query || {}) as Record<string, string | string[]>;
  query[key] = value;
  request.query = query;
}

export default async function handler(request: VercelRequest, response: VercelResponse) {
  const parts = readPath(request, "/api/admin/");

  let target: RouteHandler | null = null;

  if (parts.length === 2 && parts[0] === "auth" && parts[1] === "bootstrap") {
    target = adminAuthBootstrap;
  } else if (parts.length === 2 && parts[0] === "auth" && parts[1] === "session") {
    target = adminAuthSession;
  } else if (parts.length === 1 && parts[0] === "categories") {
    target = adminCategories;
  } else if (parts.length === 1 && parts[0] === "entitlements") {
    target = adminEntitlements;
  } else if (parts.length === 2 && parts[0] === "mercadopago" && parts[1] === "connect") {
    target = adminMpConnect;
  } else if (parts.length === 2 && parts[0] === "mercadopago" && parts[1] === "disconnect") {
    target = adminMpDisconnect;
  } else if (parts.length === 1 && parts[0] === "payments") {
    target = adminPayments;
  } else if (parts.length === 2 && parts[0] === "payments" && parts[1] === "settings") {
    target = adminPaymentSettings;
  } else if (parts.length === 2 && parts[0] === "payments") {
    setQueryParam(request, "id", parts[1]);
    target = adminPaymentById;
  } else if (parts.length === 3 && parts[0] === "payments" && parts[2] === "note") {
    setQueryParam(request, "id", parts[1]);
    target = adminPaymentNote;
  } else if (parts.length === 1 && parts[0] === "recipes") {
    target = adminRecipes;
  } else if (parts.length === 1 && parts[0] === "settings") {
    target = adminSettings;
  }

  if (!target) {
    response.status(404).json({ error: "Not found" });
    return;
  }

  await target(request, response);
}
