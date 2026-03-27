import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withApiHandler, json, assertMethod, ApiError, getClientAddress } from '../../../../src/server/shared/http.js';
import { requireAdminAccess } from '../../../../src/server/admin/guards.js';
import { requireTenantFromRequest } from '../../../../src/server/tenancy/resolver.js';
import { requireCsrf } from '../../../../src/server/security/csrf.js';
import { noteSchema } from '../../../../src/server/shared/validators.js';
import { createPaymentNote, getPaymentById } from '../../../../src/server/payments/repo.js';

function getRouteId(request: VercelRequest) {
  const value = request.query?.id;
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && value.length > 0) return String(value[0]);
  return '';
}

function getUserAgent(request: VercelRequest) {
  const header = request.headers['user-agent'];
  if (typeof header === 'string') return header;
  return '';
}

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return withApiHandler(request, response, async ({ requestId }) => {
    assertMethod(request, ['POST']);

    const { tenant } = await requireTenantFromRequest(request);
    const access = await requireAdminAccess(request);
    if (access.type === "session") {
      requireCsrf(request);
    }

    const id = getRouteId(request);
    if (!id) throw new ApiError(400, 'Missing payment ID');

    const payment = await getPaymentById(tenant.id, id);
    if (!payment) throw new ApiError(404, 'Payment not found');

    const body = noteSchema.parse(request.body ?? {});
    const note = await createPaymentNote({
      tenantId: tenant.id,
      paymentId: id,
      note: body.note,
      actorType: access.type === 'session' ? 'admin' : 'system',
      actorId: access.type === 'session' ? access.userId : 'admin-api',
      ip: getClientAddress(request),
      userAgent: getUserAgent(request),
    });

    return json(response, 201, {
      note,
      requestId,
    });
  });
}
