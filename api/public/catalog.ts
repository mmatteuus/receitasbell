import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withApiHandler, json, assertMethod, setPublicCache } from '../../src/server/shared/http.js';
import { requireTenantFromRequest } from '../../src/server/tenancy/resolver.js';
import { listRecipes } from '../../src/server/recipes/repo.js';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return withApiHandler(request, response, async ({ requestId }) => {
    assertMethod(request, ['GET']);
    const { tenant } = await requireTenantFromRequest(request);
    const recipes = await listRecipes(tenant.id);
    
    setPublicCache(response, 300); // 5 minutes
    
    return json(response, 200, {
      items: recipes,
      meta: {
        total: recipes.length,
        tenantId: tenant.id
      },
      requestId
    });
  });
}

