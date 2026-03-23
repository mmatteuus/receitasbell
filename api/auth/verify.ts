import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withApiHandler, requireQueryParam, ApiError, sendJson } from '../../src/server/shared/http.js';
import { verifyMagicLinkToken } from '../../src/server/domains/auth/magicLink.js';
import { findOrCreateUserByEmail } from '../../src/server/domains/users/repo.js';
import { signSession, setSessionCookie } from '../../src/server/domains/auth/sessions.js';
import { logAuditEvent } from '../../src/server/domains/observability/auditRepo.js';

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

    // Audit entry removed in Phase 0 cleanup
    setSessionCookie(response, sessionToken);

    await logAuditEvent({
      actorType: "user",
      actorId: user.id,
      tenantId: tenantId,
      action: "user_login_success",
      resourceType: "session",
      resourceId: sessionToken.substring(0, 10),
    });

    return response.redirect('/');
  });
}
