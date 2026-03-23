import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withApiHandler, sendJson, assertMethod, setPublicCache } from '../../src/server/http.js';
import { requireTenantFromRequest } from '../../src/server/tenants/resolver.js';
import { listRecipes } from '../../src/server/baserow/recipesRepo.js';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return withApiHandler(request, response, async (log) => {
    assertMethod(request, ['GET']);
    const { tenant } = await requireTenantFromRequest(request);
    const recipes = await listRecipes(tenant.id);
    
    setPublicCache(response, 300); // 5 minutes
    
    return sendJson(response, 200, {
      items: recipes,
      meta: {
        total: recipes.length,
        tenantId: tenant.id
      }
    });
  });
}
