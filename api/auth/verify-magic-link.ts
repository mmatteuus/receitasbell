import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withApiHandler, ApiError, getClientAddress } from '../../src/server/shared/http.js';
import { consumeMagicLink } from '../../src/server/auth/magicLinks.js';
import { findOrCreateUserByEmail } from '../../src/server/identity/repo.js';
import { startUserSession } from '../../src/server/auth/sessions.js';
import { createAuditLog } from '../../src/server/audit/service.js';
import { AuthRateLimit } from '../../src/server/shared/rateLimit.js';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return withApiHandler(request, response, async ({ requestId }) => {
    const url = new URL(request.url || '', 'http://localhost');
    const token = url.searchParams.get('token');
    const tenantId = url.searchParams.get('tenantId');
    
    if (!token || !tenantId) throw new ApiError(400, "Missing required parameters");
    
    const ip = getClientAddress(request);
    const rl = await AuthRateLimit.check(`${ip}:verify`);
    if (!rl.success) {
        response.setHeader('Retry-After', String(rl.resetAfter));
        throw new ApiError(429, `Muitos pedidos. Tente novamente em ${rl.resetAfter}s.`);
    }

    const record = await consumeMagicLink({
        tenantId,
        token,
        purpose: 'user_login'
    });
    
    if (!record) throw new ApiError(401, "Invalid or expired token");
    
    const email = record.email;
    const user = await findOrCreateUserByEmail(tenantId, email);
    
    await startUserSession(request, response, {
      tenantId: String(tenantId),
      userId: String(user.id),
      email: user.email,
      role: 'user', 
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

    const redirectTo = record.redirectTo || '/';
    response.redirect(redirectTo);
  });
}
