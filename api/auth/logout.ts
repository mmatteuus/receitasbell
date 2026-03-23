import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withApiHandler, sendJson, assertMethod } from '../../src/server/shared/http.js';
import { clearSessionCookie } from '../../src/server/domains/auth/sessions.js';
import { requireTenantFromRequest } from '../../src/server/domains/tenants/resolver.js';
import { resolveOptionalIdentityUser } from '../../src/server/shared/identity.js';
import { logAuditEvent } from '../../src/server/domains/observability/auditRepo.js';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return withApiHandler(request, response, async () => {
    assertMethod(request, ['POST']);
    const { tenant } = await requireTenantFromRequest(request);
    const { email } = await resolveOptionalIdentityUser(request);

    // Audit entry removed in Phase 0 cleanup

    clearSessionCookie(response);

    if (email) {
      await logAuditEvent({
        actorType: "user",
        actorId: email,
        tenantId: tenant.id,
        action: "user_logout",
      });
    }

    return sendJson(response, 200, { success: true });
  });
}
