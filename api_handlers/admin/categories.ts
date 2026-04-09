import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withApiHandler, json, ApiError } from '../../src/server/shared/http.js';
import { requireAdminAccess } from '../../src/server/admin/guards.js';
import { logAuditEvent } from '../../src/server/audit/repo.js';
import { requireTenantFromRequest } from '../../src/server/tenancy/resolver.js';
import { listCategories, createCategory, updateCategory, deleteCategory, getCategoryBySlug } from '../../src/server/categories/repo.js';
import { requireCsrf } from '../../src/server/security/csrf.js';
import { z } from 'zod';

const categorySchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, "Slug inválido").optional(),
  description: z.string().optional(),
  icon: z.string().optional(),
});

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .trim();
}

export default withApiHandler(async (request: VercelRequest, response: VercelResponse, { requestId }) => {
  const { tenant } = await requireTenantFromRequest(request);
  const access = await requireAdminAccess(request);
  const actorType = access.type === "session" ? "admin" : "system";
  const actorId = access.type === "session" ? access.userId : "admin-api";

  const method = (request.method || 'GET').toUpperCase();
  const url = new URL(request.url || '', 'http://localhost');
  const id = url.searchParams.get('id');

    if (method === 'GET') {
    if (id) {
      const items = await listCategories(tenant.id);
      const category = items.find((item) => String(item.id) === String(id));
      if (!category) throw new ApiError(404, "Category not found");
      return json(response, 200, { category, item: category, requestId });
    }

    const items = await listCategories(tenant.id);
    return json(response, 200, { categories: items, items, meta: { total: items.length }, requestId });
  }

  // CSRF required for mutations
  if (access.type === "session") {
    requireCsrf(request);
  }

  if (method === 'POST') {
    const body = categorySchema.parse(request.body);
    const nextSlug = body.slug || slugify(body.name);
    const existing = await getCategoryBySlug(tenant.id, nextSlug);
    if (existing) {
      throw new ApiError(409, "Já existe uma categoria com este slug.");
    }
    const result = await createCategory(tenant.id, {
      ...body,
      slug: nextSlug,
      description: body.description || "",
    });
    
    await logAuditEvent({
      tenantId: tenant.id,
      actorType,
      actorId,
      action: "create_category",
      resourceType: "category",
      resourceId: String(result.id),
      payload: body
    });

    return json(response, 201, { category: result, item: result, requestId });
  }

  if (method === 'PATCH' || method === 'PUT') {
    if (!id) throw new ApiError(400, 'Missing category ID');
    const body = categorySchema.partial().parse(request.body);
    const nextSlug = body.slug || (body.name ? slugify(body.name) : undefined);
    if (nextSlug) {
      const existing = await getCategoryBySlug(tenant.id, nextSlug);
      if (existing && String(existing.id) !== String(id)) {
        throw new ApiError(409, "Já existe uma categoria com este slug.");
      }
    }
    const result = await updateCategory(tenant.id, id, {
      ...body,
      slug: nextSlug,
    });

    await logAuditEvent({
      tenantId: tenant.id,
      actorType,
      actorId,
      action: "update_category",
      resourceType: "category",
      resourceId: String(id),
      payload: body
    });

    return json(response, 200, { category: result, item: result, requestId });
  }

  if (method === 'DELETE') {
    if (!id) throw new ApiError(400, 'Missing category ID');
    await deleteCategory(tenant.id, id);

    await logAuditEvent({
      tenantId: tenant.id,
      actorType,
      actorId,
      action: "delete_category",
      resourceType: "category",
      resourceId: String(id)
    });

    return json(response, 200, { success: true, requestId });
  }

  throw new ApiError(405, `Method ${method} not allowed`);
});
