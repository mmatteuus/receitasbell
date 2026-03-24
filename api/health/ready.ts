import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withApiHandler, json, ApiError } from '../../src/server/shared/http.js';
import { baserowFetch } from '../../src/server/integrations/baserow/client.js';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return withApiHandler(request, response, async ({ requestId }) => {
    try {
      await baserowFetch('/api/database/tables/');
      return json(response, 200, { status: 'READY', database: 'connected', requestId });
    } catch (err) {
      throw new ApiError(503, "Service Unavailable: Database unreachable");
    }
  });
}
