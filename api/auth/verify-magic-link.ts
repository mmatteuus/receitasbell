import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withApiHandler, requireQueryParam, ApiError } from '../../src/server/shared/http.js';
import { verifyMagicLinkToken } from '../../src/server/auth/magicLink.js';
import { findOrCreateUserByEmail } from '../../src/server/identity/repo.js';
import { signSession, setUserSessionCookie } from '../../src/server/auth/sessions.js';
import { createAuditLog } from '../../src/server/audit/service.js';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return withApiHandler(request, response, async () => {
    const token = requireQueryParam(request, 'token');
    const tenantId = requireQueryParam(request, 'tenantId');
    
    const record = await verifyMagicLinkToken(tenantId, token);
    if (!record) {
      throw new ApiError(401, "Invalid or expired token");
    }
    
    // O record deve conter o email que salvamos no createMagicLinkToken
    const email = record.email || "";
    if (!email) {
      throw new ApiError(500, "Token verification failed: missing email in record");
    }

    const user = await findOrCreateUserByEmail(tenantId, email);
    
    const sessionToken = signSession({
      sessionId: crypto.randomUUID(),
      userId: String(user.id),
      email: user.email,
      role: 'user', // Definindo o papel explicitamente
      tenantId: String(tenantId), // Adicionando o tenantId para consistência
      issuedAt: Date.now(),
      expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 dias
    });

    setUserSessionCookie(response, sessionToken);

    await createAuditLog(request, {
      tenantId: String(tenantId),
      actorType: 'user',
      actorId: String(user.id),
      action: 'user.login',
      resourceType: 'session',
      resourceId: String(user.id),
      payload: { email: user.email },
    });

    return response.redirect('/');
  });
}
