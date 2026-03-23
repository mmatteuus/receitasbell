import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withApiHandler, sendJson, requireAdminAccess, ApiError } from '../../src/server/shared/http.js';
import { requireTenantFromRequest } from '../../src/server/domains/tenants/resolver.js';
import { listPayments, getPaymentById } from '../../src/server/domains/payments/repo.js';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return withApiHandler(request, response, async () => {
    const { tenant } = await requireTenantFromRequest(request);
    requireAdminAccess(request);

    const url = new URL(request.url || '', 'http://localhost');
    const id = url.searchParams.get('id');

    if (id) {
      const payment = await getPaymentById(tenant.id, id);
      if (!payment) throw new ApiError(404, 'Payment not found');
      return sendJson(response, 200, payment);
    }

    const items = await listPayments(tenant.id);
    return sendJson(response, 200, { items, meta: { total: items.length } });
  });
}
