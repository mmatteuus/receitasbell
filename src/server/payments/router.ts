import type { VercelRequest, VercelResponse } from "@vercel/node";

import cardHandler from "./application/handlers/card.js";
import configHandler from "./application/handlers/config.js";
import paymentByIdHandler from "./application/handlers/[id].js";
import paymentCancelHandler from "./application/handlers/[id]/cancel.js";
import pixHandler from "./application/handlers/pix.js";
import connectAccountHandler from "./application/handlers/connect/account.js";
import connectLinkHandler from "./application/handlers/connect/onboarding-link.js";
import connectStatusHandler from "./application/handlers/connect/status.js";
import checkoutSessionHandler from "./application/handlers/checkout/session.js";
import webhookStripeHandler from "./application/handlers/webhooks/stripe.js";

export type PaymentsRouteHandler = (request: VercelRequest, response: VercelResponse) => Promise<unknown> | unknown;

function normalizePathValue(value: string | undefined) {
  return value ? value.trim() : "";
}

function readPath(request: VercelRequest, prefix: string): string[] {
  const value = request.query.path;
  if (Array.isArray(value) && value.length > 0) {
    return value
      .map((part) => normalizePathValue(String(part)))
      .filter(Boolean);
  }

  if (typeof value === "string" && value.length > 0) {
    return value
      .split("/")
      .map((part) => normalizePathValue(part))
      .filter(Boolean);
  }

  const pathname = (request.url || "").split("?")[0] || "";
  if (!pathname.startsWith(prefix)) return [];

  return pathname
    .slice(prefix.length)
    .split("/")
    .map((part) => normalizePathValue(part))
    .filter(Boolean);
}

function setQueryParam(request: VercelRequest, key: string, value: string) {
  const query = (request.query || {}) as Record<string, string | string[]>;
  query[key] = value;
  request.query = query;
}

export async function paymentsRouter(request: VercelRequest, response: VercelResponse) {
  const parts = readPath(request, "/api/payments/");
  let target: PaymentsRouteHandler | null = null;

  if (parts.length === 1 && parts[0] === "config") {
    target = configHandler;
  } else if (parts.length === 1 && parts[0] === "pix") {
    target = pixHandler;
  } else if (parts.length === 1 && parts[0] === "card") {
    target = cardHandler;
  } else if (parts.length === 1) {
    setQueryParam(request, "id", parts[0]);
    target = paymentByIdHandler;
  } else if (parts.length === 2 && parts[1] === "cancel") {
    setQueryParam(request, "id", parts[0]);
    target = paymentCancelHandler;
  } else if (parts.length === 2 && parts[0] === "connect" && parts[1] === "account") {
    target = connectAccountHandler;
  } else if (parts.length === 2 && parts[0] === "connect" && parts[1] === "onboarding-link") {
    target = connectLinkHandler;
  } else if (parts.length === 2 && parts[0] === "connect" && parts[1] === "status") {
    target = connectStatusHandler;
  } else if (parts.length === 2 && parts[0] === "checkout" && parts[1] === "session") {
    target = checkoutSessionHandler;
  } else if (parts.length === 2 && parts[0] === "webhooks" && parts[1] === "stripe") {
    target = webhookStripeHandler;
  }

  if (!target) {
    response.status(404).json({ error: "Not found" });
    return;
  }

  await target(request, response);
}
