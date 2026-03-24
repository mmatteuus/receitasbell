import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withApiHandler, sendJson, assertMethod } from '../../src/server/shared/http.js';
import { clearUserSessionCookie } from '../../src/server/auth/sessions.js';
import { requireTenantFromRequest } from '../../src/server/tenancy/resolver.js';
import { resolveOptionalIdentityUser } from '../../src/server/auth/guards.js';
import { createAuditLog } from '../../src/server/audit/service.js';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return withApiHandler(request, response, async () => {
    assertMethod(request, ['POST', 'GET']);
    const { tenant } = await requireTenantFromRequest(request);
    const { email, user } = await resolveOptionalIdentityUser(request);

    clearUserSessionCookie(response);

    if (user && email) {
      try {
        await createAuditLog({
          tenantId: String(tenant.id),
          actorType: 'user',
          actorId: String(user.id),
          action: 'user.logout',
          resourceType: 'session',
          resourceId: String(user.id),
          payload: { email },
          createdAt: new Date().toISOString(),
        });
      } catch (e) {
        // Silently fail
      }
    }

    return sendJson(response, 200, { success: true });
  });
}
