import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withApiHandler, json, ApiError } from '../../src/server/shared/http.js';
import { requireIdentityUser } from '../../src/server/auth/guards.js';
import { requireTenantFromRequest } from '../../src/server/tenancy/resolver.js';
import { createFavorite, deleteFavorite, listFavoritesByUserId } from '../../src/server/identity/favorites.repo.js';
import { favoriteSchema } from '../../src/server/shared/validators.js';
import { requireCsrf } from '../../src/server/security/csrf.js';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return withApiHandler(request, response, async ({ requestId }) => {
    const { tenant } = await requireTenantFromRequest(request);
    const identity = await requireIdentityUser(request);
    const userId = String(identity.user!.id);

    const method = (request.method || 'GET').toUpperCase();
    const url = new URL(request.url || '', 'http://localhost');

    if (method === 'GET') {
      const favorites = await listFavoritesByUserId(tenant.id, userId);
      return json(response, 200, { items: favorites, requestId });
    }

    // CSRF required for mutations
    requireCsrf(request);

    if (method === 'POST') {
      const body = favoriteSchema.parse(request.body);
      const favorite = await createFavorite(tenant.id, userId, String(body.recipeId));
      return json(response, 201, { item: favorite, requestId });
    }

    if (method === 'DELETE') {
      const recipeId = url.searchParams.get('recipeId');
      if (!recipeId) throw new ApiError(400, 'Missing recipeId');
      
      await deleteFavorite(tenant.id, userId, recipeId);
      return json(response, 200, { success: true, requestId });
    }

    throw new ApiError(405, `Method ${method} not allowed`);
  });
}
