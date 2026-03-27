import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { withApiHandler, json, ApiError } from '../../src/server/shared/http.js';
import { requireIdentityUser } from '../../src/server/auth/guards.js';
import { requireTenantFromRequest } from '../../src/server/tenancy/resolver.js';
import { listCommentsByRecipeId, createComment } from '../../src/server/recipes/comments.repo.js';
import { commentSchema } from '../../src/server/shared/validators.js';
import { requireCsrf } from '../../src/server/security/csrf.js';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return withApiHandler(request, response, async ({ requestId }) => {
    const { tenant } = await requireTenantFromRequest(request);
    
    const method = (request.method || 'GET').toUpperCase();
    const url = new URL(request.url || '', 'http://localhost');

    if (method === 'GET') {
      const recipeId = url.searchParams.get('recipeId');
      if (!recipeId) throw new ApiError(400, 'Missing recipeId');
      const items = await listCommentsByRecipeId(tenant.id, recipeId);
      return json(response, 200, { items, requestId });
    }

    // CSRF required for mutations
    requireCsrf(request);

    if (method === 'POST') {
      const body = commentSchema.parse(request.body);
      const identity = await requireIdentityUser(request);
      const comment = await createComment(tenant.id, {
        recipeId: String(body.recipeId),
        authorName: identity.user?.email || 'Anonymous', // Use session email
        authorEmail: identity.email,
        userId: String(identity.user?.id || ''),
        text: body.text,
      });
      return json(response, 201, { item: comment, requestId });
    }

    throw new ApiError(405, `Method ${method} not allowed`);
  });
}

