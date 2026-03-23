import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withApiHandler, requireQueryParam, ApiError, sendJson } from '../../src/server/http.js';
import { verifyMagicLinkToken } from '../../src/server/auth/magicLink.js';
import { findOrCreateUserByEmail } from '../../src/server/baserow/usersRepo.js';
import { signSession, setSessionCookie } from '../../src/server/auth/sessions.js';
import { logAuditEntry } from '../../src/server/logging/audit.js';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return withApiHandler(request, response, async () => {
    const token = requireQueryParam(request, 'token');
    const tenantId = requireQueryParam(request, 'tenantId');
    
    const record = await verifyMagicLinkToken(tenantId, token);
    if (!record) throw new ApiError(401, "Invalid or expired token");
    
    const user = await findOrCreateUserByEmail(tenantId, record.email || "");
    const sessionToken = signSession({
      userId: String(user.id),
      email: user.email,
      tenantId: String(tenantId),
      role: 'user',
      expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 7,
    });

    await logAuditEntry(tenantId, {
        action: 'user_login',
        resourceType: 'auth',
        resourceId: String(user.id),
        details: { email: user.email }
    });

    setSessionCookie(response, sessionToken);
    return response.redirect('/');
  });
}
