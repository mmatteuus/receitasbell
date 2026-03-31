import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withApiHandler, json, assertMethod, setPublicCache } from '../../src/server/shared/http.js';
import { requireTenantFromRequest } from '../../src/server/tenancy/resolver.js';
import { listCategories } from '../../src/server/categories/repo.js';

export default withApiHandler(async (request: VercelRequest, response: VercelResponse, { requestId }: { requestId: string }) => {
  assertMethod(request, ['GET']);
  const { tenant } = await requireTenantFromRequest(request);

  setPublicCache(response, 3600); // 1 hour

  const categories = await listCategories(tenant.id);

  return json(response, 200, {
    categories,
    items: categories,
    meta: {
      total: categories.length,
      tenantId: tenant.id
    },
    requestId
  });
});
