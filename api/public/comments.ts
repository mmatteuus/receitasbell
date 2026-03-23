import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { withApiHandler, sendJson, requireIdentityUser, readJsonBody, ApiError } from '../../src/server/shared/http.js';
import { requireTenantFromRequest } from '../../src/server/domains/tenants/resolver.js';
import { listCommentsByRecipeId, createComment } from '../../src/server/domains/recipes/comments.repo.js';
import { commentSchema } from '../../src/server/shared/validators.js';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return withApiHandler(request, response, async () => {
    const { tenant } = await requireTenantFromRequest(request);
    
    const url = new URL(request.url || '', 'http://localhost');
    const recipeId = url.searchParams.get('recipeId');

    if (request.method === 'GET') {
      const { recipeId } = z.object({ recipeId: z.string().min(1) }).parse({
        recipeId: url.searchParams.get('recipeId')
      });
      const items = await listCommentsByRecipeId(tenant.id, recipeId);
      return sendJson(response, 200, { items });
    }

    if (request.method === 'POST') {
      const body = commentSchema.parse(await readJsonBody(request));
      const identity = await requireIdentityUser(request, body.authorName);
      const comment = await createComment(tenant.id, {
        recipeId: String(body.recipeId),
        authorName: body.authorName,
        authorEmail: identity.email,
        userId: String(identity.user?.id || ''),
        text: body.text,
      });
      return sendJson(response, 201, { item: comment });
    }

    throw new ApiError(405, `Method ${request.method} not allowed`);
  });
}
