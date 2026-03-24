import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withApiHandler, json } from '../../src/server/shared/http.js';
import { revokeUserSession } from '../../src/server/auth/sessions.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return withApiHandler(req, res, async ({ requestId }) => {
    await revokeUserSession(req, res);
    return json(res, 200, { success: true, data: { ok: true }, requestId });
  });
}
