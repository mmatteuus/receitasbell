import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withApiHandler, json, assertMethod, setPublicCache, ApiError, getQueryValue } from '../../../src/server/shared/http.js';
import { requireTenantFromRequest } from '../../../src/server/tenancy/resolver.js';
import { getRecipeBySlug } from '../../../src/server/recipes/repo.js';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return withApiHandler(request, response, async ({ requestId }) => {
    assertMethod(request, ['GET']);
    const { tenant } = await requireTenantFromRequest(request);

    const url = new URL(request.url || '', 'http://localhost');
    const slug = url.searchParams.get('slug');

    if (!slug) {
      throw new ApiError(400, 'Missing recipe slug');
    }

    const recipe = await getRecipeBySlug(tenant.id, slug);

    if (!recipe) {
      throw new ApiError(404, 'Recipe not found');
    }

    setPublicCache(response, 600); // 10 minutes

    return json(response, 200, {
      item: recipe,
      requestId
    });
  });
}

