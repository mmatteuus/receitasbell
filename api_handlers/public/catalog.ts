import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withApiHandler, json, assertMethod, setPublicCache } from '../../src/server/shared/http.js';
import { requireTenantFromRequest } from '../../src/server/tenancy/resolver.js';
import { listRecipes } from '../../src/server/recipes/repo.js';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return withApiHandler(request, response, async ({ requestId }) => {
    assertMethod(request, ['GET']);
    const { tenant } = await requireTenantFromRequest(request);
    const url = new URL(request.url || '/', 'http://localhost');
    const q = url.searchParams.get("q") || undefined;
    const categorySlug = url.searchParams.get("categorySlug") || undefined;
    const idsParam = url.searchParams.get("ids");
    const ids = idsParam
      ? idsParam
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean)
      : undefined;

    const recipes = await listRecipes(tenant.id, { q, categorySlug, ids });
    
    setPublicCache(response, 300); // 5 minutes
    
    return json(response, 200, {
      recipes,
      items: recipes,
      meta: {
        total: recipes.length,
        tenantId: tenant.id
      },
      requestId
    });
  });
}

