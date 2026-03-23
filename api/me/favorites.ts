import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withApiHandler, sendJson, requireIdentityUser, readJsonBody, assertMethod, ApiError } from '../../src/server/http.js';
import { requireTenantFromRequest } from '../../src/server/tenants/resolver.js';
import { createFavorite, deleteFavorite, listFavoritesByUserId } from '../../src/server/baserow/favoritesRepo.js';
import { favoriteSchema } from '../../src/server/validators.js';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return withApiHandler(request, response, async () => {
    const { tenant } = await requireTenantFromRequest(request);
    const identity = await requireIdentityUser(request);
    const userId = String(identity.user!.id);

    const url = new URL(request.url || '', 'http://localhost');
    const recipeId = url.searchParams.get('recipeId');

    if (request.method === 'GET') {
      const favorites = await listFavoritesByUserId(tenant.id, userId);
      return sendJson(response, 200, { items: favorites });
    }

    if (request.method === 'POST') {
      const body = favoriteSchema.parse(await readJsonBody(request));
      const favorite = await createFavorite(tenant.id, userId, String(body.recipeId));
      return sendJson(response, 201, favorite);
    }

    if (request.method === 'DELETE') {
      if (!recipeId) throw new ApiError(400, 'Missing recipeId query param');
      await deleteFavorite(tenant.id, userId, recipeId);
      return sendJson(response, 200, { success: true });
    }

    throw new ApiError(405, `Method ${request.method} not allowed`);
  });
}
