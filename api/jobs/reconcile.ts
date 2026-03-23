import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withApiHandler, sendJson, ApiError, getQueryValue, getRequiredEnv } from '../../src/server/http.js';
import { runReconciliationJob } from '../../src/server/jobs/reconcile.ts';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return withApiHandler(request, response, async (log) => {
    const authHeader = request.headers.authorization;
    const expectedToken = `Bearer ${getRequiredEnv('CRON_SECRET')}`;
    const querySecret = getQueryValue(request.query.secret as any);
    
    if (authHeader !== expectedToken && querySecret !== getRequiredEnv('CRON_SECRET')) {
      log.warn("Unauthorized attempt to run reconciliation job", { ip: request.headers['x-forwarded-for'] });
      throw new ApiError(401, "Unauthorized");
    }

    const stats = await runReconciliationJob();
    log.info("Reconciliation job completed", { stats });
    
    return sendJson(response, 200, { success: true, stats });
  });
}
