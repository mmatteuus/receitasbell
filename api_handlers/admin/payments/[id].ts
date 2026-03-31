import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withApiHandler, json, assertMethod, ApiError } from '../../../src/server/shared/http.js';
import { requireAdminAccess } from '../../../src/server/admin/guards.js';
import { requireTenantFromRequest } from '../../../src/server/tenancy/resolver.js';
import { getPaymentDetailById } from '../../../src/server/payments/repo.js';

function getRouteId(request: VercelRequest) {
  const value = request.query?.id;
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && value.length > 0) return String(value[0]);
  return '';
}

export default withApiHandler(
  async (request: VercelRequest, response: VercelResponse, { requestId }) => {
    assertMethod(request, ['GET']);

    const { tenant } = await requireTenantFromRequest(request);
    await requireAdminAccess(request);

    const id = getRouteId(request);
    if (!id) throw new ApiError(400, 'Missing payment ID');

    const details = await getPaymentDetailById(tenant.id, id);
    if (!details) throw new ApiError(404, 'Payment not found');

    return json(response, 200, {
      ...details,
      requestId,
    });
  }
);
