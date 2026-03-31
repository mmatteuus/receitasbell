import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withApiHandler, json, ApiError, readJsonBody } from '../../src/server/shared/http.js';
import { requireAdminAccess } from '../../src/server/admin/guards.js';
import { requireTenantFromRequest } from '../../src/server/tenancy/resolver.js';
import { getTypedTenantSettings, updateTenantSettingsFromRequest } from '../../src/server/settings/service.js';

export default withApiHandler(async (request: VercelRequest, response: VercelResponse, { requestId }) => {
  const { tenant } = await requireTenantFromRequest(request);
  const access = await requireAdminAccess(request);

  const method = (request.method || 'GET').toUpperCase();

  if (method === 'GET') {
    const settings = await getTypedTenantSettings(tenant.id);
    return json(response, 200, { ...settings, settings, requestId });
  }

  if (method === 'PATCH' || method === 'PUT') {
    const body = await readJsonBody<Record<string, unknown>>(request);
    const settings = await updateTenantSettingsFromRequest({ request, tenantId: tenant.id, access, body });
    return json(response, 200, { success: true, settings, requestId });
  }

  throw new ApiError(405, `Method ${method} not allowed`);
});
