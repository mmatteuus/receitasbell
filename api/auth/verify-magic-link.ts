import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withApiHandler, ApiError } from '../../src/server/shared/http.js';
import { verifyMagicLinkToken } from '../../src/server/auth/magicLink.js';
import { findOrCreateUserByEmail } from '../../src/server/identity/repo.js';
import { createUserSession } from '../../src/server/auth/sessions.js';
import { createAuditLog } from '../../src/server/audit/service.js';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return withApiHandler(request, response, async ({ requestId }) => {
    const url = new URL(request.url || '', 'http://localhost');
    const token = url.searchParams.get('token');
    const tenantId = url.searchParams.get('tenantId');
    
    if (!token || !tenantId) throw new ApiError(400, "Missing required parameters");
    
    const record = await verifyMagicLinkToken(tenantId, token);
    if (!record) throw new ApiError(401, "Invalid or expired token");
    
    const email = record.email || "";
    if (!email) throw new ApiError(500, "Token verification failed: missing email");

    const user = await findOrCreateUserByEmail(tenantId, email);
    
    await createUserSession({
      userId: String(user.id),
      email: user.email,
      req: request,
      res: response,
    });

    await createAuditLog(request, {
      tenantId: String(tenantId),
      actorType: 'user',
      actorId: String(user.id),
      action: 'user.login',
      resourceType: 'session',
      resourceId: requestId,
      payload: { email: user.email },
    });

    response.redirect('/');
  });
}
