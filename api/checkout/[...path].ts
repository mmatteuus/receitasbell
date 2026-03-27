import type { VercelRequest, VercelResponse } from "@vercel/node";

import checkoutCallback from "../../api_handlers/checkout/callback.js";
import checkoutCreate from "../../api_handlers/checkout/create.js";
import checkoutWebhook from "../../api_handlers/checkout/webhook.js";

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

const routes: Record<string, RouteHandler> = {
  callback: checkoutCallback,
  create: checkoutCreate,
  webhook: checkoutWebhook,
};

export default async function handler(request: VercelRequest, response: VercelResponse) {
  const key = readPath(request, "/api/checkout/").join("/");
  const target = routes[key];

  if (!target) {
    response.status(404).json({ error: "Not found" });
    return;
  }

  await target(request, response);
}
