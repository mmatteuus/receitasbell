import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withApiHandler, sendJson, requireCronAuth } from '../../src/server/shared/http.js';
import { runReconciliationJob } from '../../src/server/jobs/reconcile.js';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return withApiHandler(request, response, async () => {
    requireCronAuth(request);

    const stats = await runReconciliationJob();
    return sendJson(response, 200, { success: true, stats });
  });
}

