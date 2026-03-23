import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withApiHandler, sendJson } from '../../src/server/http.js';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return withApiHandler(request, response, async (log) => {
    return sendJson(response, 200, { status: 'OK', timestamp: new Date().toISOString() });
  });
}
