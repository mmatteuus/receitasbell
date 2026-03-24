import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withApiHandler, sendJson, assertMethod, setPublicCache } from '../../src/server/shared/http.js';
import { requireTenantFromRequest } from '../../src/server/tenancy/resolver.js';
import { fetchBaserow, BASEROW_TABLES } from '../../src/server/integrations/baserow/client.js';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return withApiHandler(request, response, async () => {
    assertMethod(request, ['GET']);
    const { tenant } = await requireTenantFromRequest(request);

    const data = await fetchBaserow<{ results: any[] }>(
      `/api/database/rows/table/${BASEROW_TABLES.CATEGORIES}/?user_field_names=true&filter__tenantId__equal=${tenant.id}`
    );

    setPublicCache(response, 3600); // 1 hour

    return sendJson(response, 200, {
      items: data.results.map(row => ({
        id: String(row.id),
        slug: row.slug,
        name: row.name,
        description: row.description || '',
      })),
      meta: {
        total: data.results.length,
        tenantId: tenant.id
      }
    });
  });
}

