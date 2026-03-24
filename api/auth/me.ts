import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withApiHandler, json, ApiError } from '../../src/server/shared/http.js';
import { getUserSession } from '../../src/server/auth/sessions.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return withApiHandler(req, res, async ({ requestId }) => {
    const session = await getUserSession(req);
    if (!session) throw new ApiError(401, 'Not authenticated');
    return json(res, 200, { success: true, data: { user: { id: session.userId, email: session.email } }, requestId });
  });
}
