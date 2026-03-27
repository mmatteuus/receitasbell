import type { VercelRequest, VercelResponse } from "@vercel/node";

import publicCatalog from "../../api_handlers/public/catalog.js";
import publicCategories from "../../api_handlers/public/categories.js";
import publicComments from "../../api_handlers/public/comments.js";
import publicNewsletter from "../../api_handlers/public/newsletter.js";
import publicRatings from "../../api_handlers/public/ratings.js";
import publicRecipeBySlug from "../../api_handlers/public/recipes/[slug].js";

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

const routes: Record<string, RouteHandler> = {
  "catalog": publicCatalog,
  "categories": publicCategories,
  "comments": publicComments,
  "newsletter": publicNewsletter,
  "ratings": publicRatings,
};

export default async function handler(request: VercelRequest, response: VercelResponse) {
  const parts = readPath(request, "/api/public/");

  if (parts.length === 2 && parts[0] === "recipes") {
    setQueryParam(request, "slug", parts[1]);
    await publicRecipeBySlug(request, response);
    return;
  }

  const target = routes[parts.join("/")];
  if (!target) {
    response.status(404).json({ error: "Not found" });
    return;
  }

  await target(request, response);
}
