import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withApiHandler, sendJson, ApiError } from '../../src/server/shared/http.js';
import { requireAdminAccess } from '../../src/server/admin/guards.js';
import { requireTenantFromRequest } from '../../src/server/tenancy/resolver.js';
import { listPayments, getPaymentById } from '../../src/server/payments/repo.js';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return withApiHandler(request, response, async () => {
    const { tenant } = await requireTenantFromRequest(request);
    await requireAdminAccess(request);

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

