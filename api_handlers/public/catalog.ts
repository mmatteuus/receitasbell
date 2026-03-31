import type { VercelRequest, VercelResponse } from "@vercel/node";
import { withApiHandler, json, assertMethod, setPublicCache } from "../../src/server/shared/http.js";
import { requireTenantFromRequest } from "../../src/server/tenancy/resolver.js";
import { listRecipes, type RecipeListOrder, type RecipeListTempo, type RecipeListTier } from "../../src/server/recipes/repo.js";

function normalizeTier(value: string | null): RecipeListTier {
  if (value === "free" || value === "paid") {
    return value;
  }
  return "all";
}

function normalizeTempo(value: string | null): RecipeListTempo {
  if (value === "quick" || value === "medium" || value === "long") {
    return value;
  }
  return "all";
}

function normalizeOrder(value: string | null): RecipeListOrder {
  if (value === "timeAsc" || value === "timeDesc") {
    return value;
  }
  return "latest";
}

export default withApiHandler(async (request, response, { requestId }) => {
  assertMethod(request, ["GET"]);
  const { tenant } = await requireTenantFromRequest(request);

  const url = new URL(request.url || "/", "http://localhost");
  const q = url.searchParams.get("q") || undefined;
  const categorySlug =
    url.searchParams.get("category") ||
    url.searchParams.get("categorySlug") ||
    url.searchParams.get("cat") ||
    url.searchParams.get("categoria") ||
    undefined;

  const idsParam = url.searchParams.get("ids");
  const ids = idsParam
    ? idsParam
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean)
    : undefined;

  const tier = normalizeTier(url.searchParams.get("tier"));
  const tempo = normalizeTempo(url.searchParams.get("tempo"));
  const ordem = normalizeOrder(url.searchParams.get("ordem"));

  const recipes = await listRecipes(tenant.id, {
    q,
    categorySlug,
    ids,
    tier,
    tempo,
    ordem,
  });

  setPublicCache(response, 300);

  return json(response, 200, {
    recipes,
    items: recipes,
    meta: {
      total: recipes.length,
      tenantId: tenant.id,
      filters: {
        q: q || "",
        categorySlug: categorySlug || "all",
        tier,
        tempo,
        ordem,
      },
    },
    requestId,
  });
});
