import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withApiHandler, sendJson, ApiError } from '../../src/server/shared/http.js';
import { fetchBaserow } from '../../src/server/integrations/baserow/client.js';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return withApiHandler(request, response, async (log) => {
    try {
      // Test basic connectivity to Baserow by fetching a very small list (1 row)
      await fetchBaserow('/api/database/tables/', { method: 'GET' });
      return sendJson(response, 200, { status: 'READY', database: 'connected' });
    } catch (err) {
      log.error("Readiness check failed: Database unreachable", err);
      throw new ApiError(503, "Service Unavailable: Database unreachable");
    }
  });
}
