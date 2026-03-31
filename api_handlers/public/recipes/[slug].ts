import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withApiHandler, json, assertMethod, setPublicCache, ApiError } from '../../../src/server/shared/http.js';
import { requireTenantFromRequest } from '../../../src/server/tenancy/resolver.js';
import { getRecipeBySlug } from '../../../src/server/recipes/repo.js';

export default withApiHandler(async (request: VercelRequest, response: VercelResponse, { requestId }: { requestId: string }) => {
  assertMethod(request, ['GET']);
  const { tenant } = await requireTenantFromRequest(request);

  const slugFromPath = request.query?.slug;
  const slug = typeof slugFromPath === "string"
    ? slugFromPath
    : Array.isArray(slugFromPath) && slugFromPath.length > 0
      ? slugFromPath[0]
      : new URL(request.url || '', 'http://localhost').searchParams.get('slug');

  if (!slug) {
    throw new ApiError(400, 'Missing recipe slug');
  }

  const recipe = await getRecipeBySlug(tenant.id, slug);

  if (!recipe) {
    throw new ApiError(404, 'Recipe not found');
  }

  setPublicCache(response, 600); // 10 minutes

  return json(response, 200, {
    recipe,
    item: recipe,
    requestId
  });
});

