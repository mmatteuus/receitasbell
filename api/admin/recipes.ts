import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withApiHandler, sendJson, requireAdminAccess, readJsonBody, ApiError } from '../../src/server/http.js';
import { requireTenantFromRequest } from '../../src/server/tenants/resolver.js';
import { listRecipes, createRecipe, updateRecipe, deleteRecipe } from '../../src/server/baserow/recipesRepo.js';
import { logAuditEntry } from '../../src/server/logging/audit.js';
import { z } from 'zod';

const recipeSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  priceBRL: z.number().min(0),
  categoryId: z.string().or(z.number()).optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
});

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return withApiHandler(request, response, async () => {
    const { tenant } = await requireTenantFromRequest(request);
    requireAdminAccess(request);

    const method = request.method;
    const url = new URL(request.url || '', 'http://localhost');
    const id = url.searchParams.get('id');

    if (method === 'GET') {
      const items = await listRecipes(tenant.id);
      return sendJson(response, 200, { items, meta: { total: items.length } });
    }

    if (method === 'POST') {
      const body = recipeSchema.parse(await readJsonBody(request));
      const result = await createRecipe(tenant.id, body);
      
      await logAuditEntry(tenant.id, {
        action: 'create_recipe',
        resourceType: 'recipe',
        resourceId: String(result.id),
        details: body
      });

      return sendJson(response, 201, result);
    }

    if (method === 'PATCH' || method === 'PUT') {
      if (!id) throw new ApiError(400, 'Missing recipe ID');
      const body = recipeSchema.partial().parse(await readJsonBody(request));
      const result = await updateRecipe(tenant.id, id, body);

      await logAuditEntry(tenant.id, {
        action: 'update_recipe',
        resourceType: 'recipe',
        resourceId: String(id),
        details: body
      });

      return sendJson(response, 200, result);
    }

    if (method === 'DELETE') {
      if (!id) throw new ApiError(400, 'Missing recipe ID');
      await deleteRecipe(tenant.id, id);

      await logAuditEntry(tenant.id, {
        action: 'delete_recipe',
        resourceType: 'recipe',
        resourceId: String(id)
      });

      return sendJson(response, 204, {});
    }

    throw new ApiError(405, `Method ${method} not allowed`);
  });
}
