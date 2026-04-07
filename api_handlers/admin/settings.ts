import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withApiHandler, json, ApiError, readJsonBody } from '../../src/server/shared/http.js';
import { requireAdminAccess } from '../../src/server/admin/guards.js';
import { requireTenantFromRequest } from '../../src/server/tenancy/resolver.js';
import { getTypedTenantSettings, updateTenantSettingsFromRequest } from '../../src/server/settings/service.js';
import { createAuditLog } from '../../src/server/audit/service.js';

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

    // P1-3: Auditoria de Log
    if (access.type === 'session') {
      await createAuditLog({
        organization_id: tenant.id,
        user_id: access.userId,
        action: 'admin.update_settings',
        resource: 'organizations',
        resource_id: tenant.id,
        metadata: { body },
        ip: String(request.headers['x-forwarded-for'] ?? ''),
        user_agent: String(request.headers['user-agent'] ?? ''),
      });
    }

    return json(response, 200, { success: true, settings, requestId });
  }

  throw new ApiError(405, `Method ${method} not allowed`);
});
