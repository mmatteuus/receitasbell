import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withApiHandler, json, assertMethod, setPublicCache } from '../../src/server/shared/http.js';
import { requireTenantFromRequest } from '../../src/server/tenancy/resolver.js';
import { baserowFetch } from '../../src/server/integrations/baserow/client.js';
import { baserowTables } from '../../src/server/integrations/baserow/tables.js';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return withApiHandler(request, response, async ({ requestId }) => {
    assertMethod(request, ['GET']);
    const { tenant } = await requireTenantFromRequest(request);

    const data = await baserowFetch<{ results: any[] }>(
      `/api/database/rows/table/${baserowTables.categories}/?user_field_names=true&filter__tenantId__equal=${tenant.id}`
    );

    setPublicCache(response, 3600); // 1 hour

    return json(response, 200, {
      items: data.results.map(row => ({
        id: String(row.id),
        slug: row.slug,
        name: row.name,
        description: row.description || '',
      })),
      meta: {
        total: data.results.length,
        tenantId: tenant.id
      },
      requestId
    });
  });
}

