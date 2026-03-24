import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withApiHandler, json, requireCronAuth } from '../../src/server/shared/http.js';
import { runCleanupJob } from '../../src/server/jobs/maintenance.js';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return withApiHandler(request, response, async ({ requestId }) => {
    requireCronAuth(request);
    const stats = await runCleanupJob();
    return json(response, 200, { success: true, stats, requestId });
  });
}
