import type { VercelRequest, VercelResponse } from "@vercel/node";

import paymentCard from "../../api_handlers/payments/card.js";
import paymentConfig from "../../api_handlers/payments/config.js";
import paymentById from "../../api_handlers/payments/[id].js";
import paymentCancel from "../../api_handlers/payments/[id]/cancel.js";
import paymentPix from "../../api_handlers/payments/pix.js";

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
  const parts = readPath(request, "/api/payments/");
  let target: RouteHandler | null = null;

  if (parts.length === 1 && parts[0] === "config") {
    target = paymentConfig;
  } else if (parts.length === 1 && parts[0] === "pix") {
    target = paymentPix;
  } else if (parts.length === 1 && parts[0] === "card") {
    target = paymentCard;
  } else if (parts.length === 1) {
    setQueryParam(request, "id", parts[0]);
    target = paymentById;
  } else if (parts.length === 2 && parts[1] === "cancel") {
    setQueryParam(request, "id", parts[0]);
    target = paymentCancel;
  }

  if (!target) {
    response.status(404).json({ error: "Not found" });
    return;
  }

  await target(request, response);
}
