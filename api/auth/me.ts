import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withApiHandler, json, ApiError } from '../../src/server/shared/http.js';
import { requireUserSession } from '../../src/server/auth/sessions.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return withApiHandler(req, res, async ({ requestId }) => {
    const session = await requireUserSession(req);
    return json(res, 200, { 
        success: true, 
        data: { 
            user: { 
                id: session.userId, 
                email: session.email,
                role: session.role
            } 
        }, 
        requestId 
    });
  });
}
