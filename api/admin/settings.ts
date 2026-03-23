import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withApiHandler, sendJson, requireAdminAccess, readJsonBody, ApiError } from '../../src/server/http.js';
import { requireTenantFromRequest } from '../../src/server/tenants/resolver.js';
import { getSettingsMap, updateSettings } from '../../src/server/baserow/settingsRepo.js';
import { logAuditEntry } from '../../src/server/logging/audit.js';

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

      await logAuditEntry(tenant.id, {
        action: 'update_settings',
        resourceType: 'settings',
        details: body
      });

      return sendJson(response, 200, { success: true });
    }

    throw new ApiError(405, `Method ${request.method} not allowed`);
  });
}
