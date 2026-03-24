import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withApiHandler, json, ApiError } from '../../src/server/shared/http.js';
import { requireAdminAccess } from '../../src/server/admin/guards.js';
import { logAuditEvent } from '../../src/server/audit/repo.js';
import { requireTenantFromRequest } from '../../src/server/tenancy/resolver.js';
import { getSettingsMap, updateSettings } from '../../src/server/settings/repo.js';
import { requireCsrf } from '../../src/server/security/csrf.js';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return withApiHandler(request, response, async ({ requestId }) => {
    const { tenant } = await requireTenantFromRequest(request);
    await requireAdminAccess(request);

    const method = (request.method || 'GET').toUpperCase();

    if (method === 'GET') {
      const settings = await getSettingsMap(tenant.id);
      return json(response, 200, { ...settings, requestId });
    }

    if (method === 'PATCH' || method === 'PUT') {
      requireCsrf(request);
      const body = request.body as Record<string, any>;
      await updateSettings(tenant.id, body);

      await logAuditEvent({
        tenantId: tenant.id,
        actorType: "admin",
        actorId: "admin",
        action: "update_settings",
        resourceType: "settings",
        resourceId: "global",
        payload: body
      });

      return json(response, 200, { success: true, requestId });
    }

    throw new ApiError(405, `Method ${method} not allowed`);
  });
}

