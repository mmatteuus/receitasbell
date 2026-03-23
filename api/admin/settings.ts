import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withApiHandler, sendJson, requireAdminAccess, readJsonBody, ApiError } from '../../src/server/shared/http.js';
import { logAuditEvent } from '../../src/server/domains/observability/auditRepo.js';
import { requireTenantFromRequest } from '../../src/server/domains/tenants/resolver.js';
import { getSettingsMap, updateSettings } from '../../src/server/integrations/baserow/settingsRepo.js';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return withApiHandler(request, response, async () => {
    const { tenant } = await requireTenantFromRequest(request);
    requireAdminAccess(request);

    if (request.method === 'GET') {
      const settings = await getSettingsMap(tenant.id);
      return sendJson(response, 200, settings);
    }

    if (request.method === 'PATCH' || request.method === 'PUT') {
      const body = await readJsonBody<Record<string, any>>(request);
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

      return sendJson(response, 200, { success: true });
    }

    throw new ApiError(405, `Method ${request.method} not allowed`);
  });
}
