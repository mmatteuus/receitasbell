import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withApiHandler, json, ApiError } from '../../src/server/shared/http.js';
import { requireAdminAccess } from '../../src/server/admin/guards.js';
import { logAuditEvent } from '../../src/server/audit/repo.js';
import { requireTenantFromRequest } from '../../src/server/tenancy/resolver.js';
import { listRecipes, createRecipe, updateRecipe, deleteRecipe, getRecipeById, getRecipeBySlug } from '../../src/server/recipes/repo.js';
import { requireCsrf } from '../../src/server/security/csrf.js';
import { z } from 'zod';

const recipeSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, "Slug inválido"),
  description: z.string().optional(),
  priceBRL: z.number().min(0).nullable().optional(),
  categorySlug: z.string().optional(),
  categoryId: z.string().or(z.number()).optional(),
  imageUrl: z.string().url().optional().or(z.literal("")).or(z.null()),
  status: z.enum(["published", "draft"]).optional(),
  prepTime: z.number().optional(),
  cookTime: z.number().optional(),
  difficulty: z.enum(["Fácil", "Médio", "Difícil"]).optional(),
});

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return withApiHandler(request, response, async ({ requestId }) => {
    const { tenant } = await requireTenantFromRequest(request);
    const access = await requireAdminAccess(request);
    const actorType = access.type === "session" ? "admin" : "system";
    const actorId = access.type === "session" ? access.userId : "admin-api";

    const method = (request.method || 'GET').toUpperCase();
    const url = new URL(request.url || '', 'http://localhost');
    const id = url.searchParams.get('id');
    const slug = url.searchParams.get('slug');
    const q = url.searchParams.get('q') || undefined;
    const categorySlug = url.searchParams.get('categorySlug') || undefined;
    const idsParam = url.searchParams.get("ids");
    const ids = idsParam
      ? idsParam
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean)
      : undefined;

    if (method === 'GET') {
      if (id) {
        const recipe = await getRecipeById(tenant.id, id);
        if (!recipe) throw new ApiError(404, "Recipe not found");
        return json(response, 200, { recipe, item: recipe, requestId });
      }

      if (slug) {
        const recipe = await getRecipeBySlug(tenant.id, slug);
        if (!recipe) throw new ApiError(404, "Recipe not found");
        return json(response, 200, { recipe, item: recipe, requestId });
      }

      const items = await listRecipes(tenant.id, { includeDrafts: true, q, categorySlug, ids });
      return json(response, 200, { recipes: items, items, meta: { total: items.length }, requestId });
    }

    // CSRF required for mutations
    if (access.type === "session") {
      requireCsrf(request);
    }

    if (method === 'POST') {
      const body = recipeSchema.parse(request.body);
      const result = await createRecipe(tenant.id, {
        ...body,
        categorySlug: body.categorySlug ?? (body.categoryId ? String(body.categoryId) : undefined),
      });
      
      await logAuditEvent({
        tenantId: tenant.id,
        actorType,
        actorId,
        action: "create_recipe",
        resourceType: "recipe",
        resourceId: String(result.id),
        payload: body
      });

      return json(response, 201, { recipe: result, item: result, requestId });
    }

    if (method === 'PATCH' || method === 'PUT') {
      if (!id) throw new ApiError(400, 'Missing recipe ID');
      const body = recipeSchema.partial().parse(request.body);
      const result = await updateRecipe(tenant.id, id, {
        ...body,
        categorySlug: body.categorySlug ?? (body.categoryId ? String(body.categoryId) : undefined),
      });

      await logAuditEvent({
        tenantId: tenant.id,
        actorType,
        actorId,
        action: "update_recipe",
        resourceType: "recipe",
        resourceId: String(id),
        payload: body
      });

      return json(response, 200, { recipe: result, item: result, requestId });
    }

    if (method === 'DELETE') {
      if (!id) throw new ApiError(400, 'Missing recipe ID');
      await deleteRecipe(tenant.id, id);

      await logAuditEvent({
        tenantId: tenant.id,
        actorType,
        actorId,
        action: "delete_recipe",
        resourceType: "recipe",
        resourceId: String(id)
      });

      return json(response, 200, { success: true, requestId });
    }

    throw new ApiError(405, `Method ${method} not allowed`);
  });
}
