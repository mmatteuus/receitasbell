import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withApiHandler, sendJson, readJsonBody, ApiError } from '../../src/server/shared/http.js';
import { requireAdminAccess } from '../../src/server/admin/guards.js';
import { logAuditEvent } from '../../src/server/audit/repo.js';
import { requireTenantFromRequest } from '../../src/server/tenancy/resolver.js';
import { listRecipes, createRecipe, updateRecipe, deleteRecipe } from '../../src/server/recipes/repo.js';
import { z } from 'zod';

const recipeSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, "Slug inválido"),
  description: z.string().optional(),
  priceBRL: z.number().min(0).nullable().optional(),
  categoryId: z.string().or(z.number()).optional(),
  imageUrl: z.string().url().optional().or(z.literal("")).or(z.null()),
  status: z.enum(["published", "draft"]).optional(),
  prepTime: z.number().optional(),
  cookTime: z.number().optional(),
  difficulty: z.enum(["Fácil", "Médio", "Difícil"]).optional(),
});

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return withApiHandler(request, response, async () => {
    const { tenant } = await requireTenantFromRequest(request);
    await requireAdminAccess(request);

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
      
      await logAuditEvent({
        tenantId: tenant.id,
        actorType: "admin",
        actorId: "admin", // Will be refined with real admin ID if session provides it
        action: "create_recipe",
        resourceType: "recipe",
        resourceId: String(result.id),
        payload: body
      });

      return sendJson(response, 201, { item: result });
    }

    if (method === 'PATCH' || method === 'PUT') {
      if (!id) throw new ApiError(400, 'Missing recipe ID');
      const body = recipeSchema.partial().parse(await readJsonBody(request));
      const result = await updateRecipe(tenant.id, id, body);

      await logAuditEvent({
        tenantId: tenant.id,
        actorType: "admin",
        actorId: "admin",
        action: "update_recipe",
        resourceType: "recipe",
        resourceId: String(id),
        payload: body
      });

      return sendJson(response, 200, { item: result });
    }

    if (method === 'DELETE') {
      if (!id) throw new ApiError(400, 'Missing recipe ID');
      await deleteRecipe(tenant.id, id);

      await logAuditEvent({
        tenantId: tenant.id,
        actorType: "admin",
        actorId: "admin",
        action: "delete_recipe",
        resourceType: "recipe",
        resourceId: String(id)
      });

      return sendJson(response, 204, {});
    }

    throw new ApiError(405, `Method ${method} not allowed`);
  });
}

