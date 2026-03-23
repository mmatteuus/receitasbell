import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withApiHandler, sendJson, requireIdentityUser } from '../../src/server/shared/http.js';
import { requireTenantFromRequest } from '../../src/server/domains/tenants/resolver.js';
import { fetchBaserow, BASEROW_TABLES } from '../../src/server/integrations/baserow/client.js';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return withApiHandler(request, response, async () => {
    const { tenant } = await requireTenantFromRequest(request);
    const user = await requireIdentityUser(request);

    // Filter by tenant and the authenticated user's email (used as userId in this system)
    const data = await fetchBaserow<{ results: any[] }>(
      `/api/database/rows/table/${BASEROW_TABLES.PAYMENTS}/?user_field_names=true&filter__tenantId__equal=${tenant.id}&filter__userId__equal=${user.email}`
    );

    return sendJson(response, 200, {
      items: data.results.map(row => ({
        id: String(row.id),
        amount: Number(row.amount),
        status: row.status,
        createdAt: row.created_at,
        recipeIds: JSON.parse(row.recipe_ids_json || "[]"),
        items: JSON.parse(row.items_json || "[]")
      })),
      meta: {
        total: data.results.length
      }
    });
  });
}
