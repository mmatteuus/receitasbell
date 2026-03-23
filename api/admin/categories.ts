import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withApiHandler, sendJson, requireAdminAccess, readJsonBody, ApiError } from '../../src/server/http.js';
import { requireTenantFromRequest } from '../../src/server/tenants/resolver.js';
import { listCategories, createCategory, updateCategory, deleteCategory } from '../../src/server/baserow/categoriesRepo.js';
import { logAuditEntry } from '../../src/server/logging/audit.js';
import { z } from 'zod';

const categorySchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
});

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return withApiHandler(request, response, async () => {
    const { tenant } = await requireTenantFromRequest(request);
    requireAdminAccess(request);

    const method = request.method;
    const url = new URL(request.url || '', 'http://localhost');
    const id = url.searchParams.get('id');

    if (method === 'GET') {
      const items = await listCategories(tenant.id);
      return sendJson(response, 200, { items, meta: { total: items.length } });
    }

    if (method === 'POST') {
      const body = categorySchema.parse(await readJsonBody(request));
      const result = await createCategory(tenant.id, { ...body, description: "" });
      
      await logAuditEntry(tenant.id, {
        action: 'create_category',
        resourceType: 'category',
        resourceId: String(result.id),
        details: body
      });

      return sendJson(response, 201, result);
    }

    // ... rest of logic remains same but ensuring slug is handled
    if (method === 'PATCH' || method === 'PUT') {
      if (!id) throw new ApiError(400, 'Missing category ID');
      const body = categorySchema.partial().parse(await readJsonBody(request));
      const result = await updateCategory(tenant.id, id, body);

      await logAuditEntry(tenant.id, {
        action: 'update_category',
        resourceType: 'category',
        resourceId: String(id),
        details: body
      });

      return sendJson(response, 200, result);
    }

    if (method === 'DELETE') {
      if (!id) throw new ApiError(400, 'Missing category ID');
      await deleteCategory(tenant.id, id);

      await logAuditEntry(tenant.id, {
        action: 'delete_category',
        resourceType: 'category',
        resourceId: String(id)
      });

      return sendJson(response, 204, {});
    }

    throw new ApiError(405, `Method ${method} not allowed`);
  });
}
