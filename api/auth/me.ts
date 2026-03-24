import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withApiHandler, sendJson, ApiError } from '../../src/server/shared/http.js';
import { getUserSession } from '../../src/server/auth/sessions.js';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return withApiHandler(request, response, async () => {
    const session = await getUserSession(request);
    
    // Non-blocking for "me" endpoint commonly, but here we enforce it
    // as per Phase 1/3 requirements for secure identity.
    if (!session) {
      throw new ApiError(401, 'Not authenticated');
    }

    return sendJson(response, 200, {
      user: {
        id: session.userId,
        email: session.email,
        role: session.role,
        tenantId: session.tenantId,
      },
      authenticated: true,
    });
  });
}
