import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withApiHandler, sendJson, ApiError } from '../src/server/http.js';

/**
 * LEGACY CATCH-ALL ROUTER
 * Dedicated handlers have been moved to /api/[domain]/ handlers.
 * This file remains only for graceful 404 handling of old routes.
 */
export default async function handler(request: VercelRequest, response: VercelResponse) {
  return withApiHandler(request, response, async () => {
    throw new ApiError(404, 'Legacy route decommissioned. Use dedicated domain endpoints.');
  });
}
