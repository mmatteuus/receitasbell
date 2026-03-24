import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withApiHandler, ApiError } from '../src/server/shared/http.js';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return withApiHandler(request, response, async () => {
    throw new ApiError(404, 'Legacy route decommissioned. Use dedicated domain endpoints.');
  });
}
