import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withApiHandler, sendJson, ApiError, requireCronAuth } from '../../src/server/shared/http.js';
import { runCleanupJob } from '../../src/server/jobs/maintenance.js';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return withApiHandler(request, response, async () => {
    requireCronAuth(request);

    await runCleanupJob();
    return sendJson(response, 200, { success: true });
  });
}
