import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withApiHandler, sendJson } from '../../src/server/http.js';
import { resolveOptionalIdentityUser } from '../../src/server/identity.js';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return withApiHandler(request, response, async () => {
    const user = await resolveOptionalIdentityUser(request);
    return sendJson(response, 200, user);
  });
}
