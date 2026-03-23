import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withApiHandler, sendJson, assertMethod } from '../../src/server/http.js';
import { clearSessionCookie } from '../../src/server/auth/sessions.js';
import { requireTenantFromRequest } from '../../src/server/tenants/resolver.js';
import { resolveOptionalIdentityUser } from '../../src/server/identity.js';
import { logAuditEntry } from '../../src/server/logging/audit.js';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return withApiHandler(request, response, async () => {
    assertMethod(request, ['POST']);
    const { tenant } = await requireTenantFromRequest(request);
    const { email } = await resolveOptionalIdentityUser(request);

    await logAuditEntry(tenant.id, {
      action: 'user_logout',
      resourceType: 'auth',
      details: { email }
    });

    clearSessionCookie(response);
    return sendJson(response, 200, { success: true });
  });
}
