import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withApiHandler, json, assertMethod, ApiError } from '../../src/server/shared/http.js';
import { requireAdminAccess } from '../../src/server/admin/guards.js';
import { requireTenantFromRequest } from '../../src/server/tenancy/resolver.js';
import { getPaymentById, listPayments } from '../../src/server/payments/repo.js';

function getQueryString(request: VercelRequest, key: string) {
  const value = request.query?.[key];
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && value.length > 0) return String(value[0]);
  return '';
}

function getQueryList(request: VercelRequest, key: string) {
  return getQueryString(request, key)
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return withApiHandler(request, response, async ({ requestId }) => {
    assertMethod(request, ['GET']);

    const { tenant } = await requireTenantFromRequest(request);
    await requireAdminAccess(request);

    const id = getQueryString(request, 'id');
    if (id) {
      const payment = await getPaymentById(tenant.id, id);
      if (!payment) throw new ApiError(404, 'Payment not found');
      return json(response, 200, { payment, data: payment, requestId });
    }

    const payments = await listPayments(tenant.id, {
      status: getQueryList(request, 'status'),
      paymentMethod: getQueryList(request, 'method'),
      email: getQueryString(request, 'email') || undefined,
      paymentId: getQueryString(request, 'paymentId') || undefined,
      paymentIdGateway: getQueryString(request, 'paymentIdGateway') || undefined,
      externalReference: getQueryString(request, 'externalReference') || undefined,
      dateFrom: getQueryString(request, 'dateFrom') || getQueryString(request, 'from') || undefined,
      dateTo: getQueryString(request, 'dateTo') || getQueryString(request, 'to') || undefined,
      from: getQueryString(request, 'from') || undefined,
      to: getQueryString(request, 'to') || undefined,
    });

    return json(response, 200, {
      payments,
      items: payments,
      meta: { total: payments.length },
      requestId,
    });
  });
}
