import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withApiHandler, json, ApiError, assertMethod } from '../../src/server/shared/http.js';
import { requireAdminAccess } from '../../src/server/admin/guards.js';
import { logAuditEvent } from '../../src/server/audit/repo.js';
import { requireTenantFromRequest } from '../../src/server/tenancy/resolver.js';
import { listCategories, createCategory, updateCategory, deleteCategory } from '../../src/server/categories/repo.js';
import { requireCsrf } from '../../src/server/security/csrf.js';
import { z } from 'zod';

const categorySchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, "Slug inválido"),
  description: z.string().optional(),
});

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return withApiHandler(request, response, async ({ requestId }) => {
    const { tenant } = await requireTenantFromRequest(request);
    await requireAdminAccess(request);

    const method = (request.method || 'GET').toUpperCase();
    const url = new URL(request.url || '', 'http://localhost');
    const id = url.searchParams.get('id');

    if (method === 'GET') {
      const items = await listCategories(tenant.id);
      return json(response, 200, { items, meta: { total: items.length }, requestId });
    }

    // CSRF required for mutations
    requireCsrf(request);

    if (method === 'POST') {
      const body = categorySchema.parse(request.body);
      const result = await createCategory(tenant.id, { ...body, description: body.description || "" });
      
      await logAuditEvent({
        tenantId: tenant.id,
        actorType: "admin",
        actorId: "admin",
        action: "create_category",
        resourceType: "category",
        resourceId: String(result.id),
        payload: body
      });

      return json(response, 201, { item: result, requestId });
    }

    if (method === 'PATCH' || method === 'PUT') {
      if (!id) throw new ApiError(400, 'Missing category ID');
      const body = categorySchema.partial().parse(request.body);
      const result = await updateCategory(tenant.id, id, body);

      await logAuditEvent({
        tenantId: tenant.id,
        actorType: "admin",
        actorId: "admin",
        action: "update_category",
        resourceType: "category",
        resourceId: String(id),
        payload: body
      });

      return json(response, 200, { item: result, requestId });
    }

    if (method === 'DELETE') {
      if (!id) throw new ApiError(400, 'Missing category ID');
      await deleteCategory(tenant.id, id);

      await logAuditEvent({
        tenantId: tenant.id,
        actorType: "admin",
        actorId: "admin",
        action: "delete_category",
        resourceType: "category",
        resourceId: String(id)
      });

      return json(response, 200, { success: true, requestId });
    }

    throw new ApiError(405, `Method ${method} not allowed`);
  });
}

