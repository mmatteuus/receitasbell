import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withApiHandler, sendJson, assertMethod, readJsonBody, ApiError, setAdminSessionCookie, clearAdminSessionCookie, getAdminApiSecret, hasAdminAccess } from '../../src/server/http.js';
import { requireTenantFromRequest } from '../../src/server/tenants/resolver.js';
import { logAuditEntry } from '../../src/server/logging/audit.js';
import { consumeAdminRateLimit, getClientAddress } from '../../src/server/rateLimit.js';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return withApiHandler(request, response, async (log) => {
    assertMethod(request, ['POST', 'GET', 'DELETE']);
    const { tenant } = await requireTenantFromRequest(request);

    if (request.method === 'GET') {
      return sendJson(response, 200, { authenticated: hasAdminAccess(request) });
    }

    if (request.method === 'DELETE') {
      clearAdminSessionCookie(request, response);
      return sendJson(response, 200, { success: true });
    }

    assertMethod(request, ['POST']);
    const body = await readJsonBody<{ password?: string }>(request);
    const password = String(body.password || '');
    
    const clientAddress = getClientAddress(request);
    const rateResult = await consumeAdminRateLimit(clientAddress);
    if (!rateResult.success) {
      response.setHeader('Retry-After', String(rateResult.resetAfter));
      throw new ApiError(429, 'Too many attempts');
    }

    if (password !== getAdminApiSecret()) {
      throw new ApiError(401, 'Invalid password');
    }

    setAdminSessionCookie(request, response, password);
    
    await logAuditEntry(tenant.id, {
      action: 'admin_login',
      resourceType: 'auth',
      details: { method: 'password' }
    });

    return sendJson(response, 200, { success: true });
  });
}
