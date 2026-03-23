import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withApiHandler, sendJson, assertMethod, setPublicCache, ApiError } from '../../src/server/shared/http.js';
import { requireTenantFromRequest } from '../../src/server/domains/tenants/resolver.js';
import { getRecipeBySlug } from '../../src/server/domains/recipes/repo.js';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return withApiHandler(request, response, async () => {
    assertMethod(request, ['GET']);
    const { tenant } = await requireTenantFromRequest(request);

    const url = new URL(request.url || '', 'http://localhost');
    const slug = url.pathname.split('/').pop();

    if (!slug || slug === 'recipes') {
      throw new ApiError(400, 'Missing recipe slug');
    }

    const recipe = await getRecipeBySlug(tenant.id, slug);

    if (!recipe) {
      throw new ApiError(404, 'Recipe not found');
    }

    setPublicCache(response, 600); // 10 minutes

    return sendJson(response, 200, {
      item: recipe
    });
  });
}
