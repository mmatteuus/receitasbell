import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withApiHandler, sendJson, ApiError, getQueryValue, getRequiredEnv } from '../../src/server/shared/http.js';
import { runReconciliationJob } from '../../src/server/domains/jobs/reconcile.js';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return withApiHandler(request, response, async (log) => {
    const authHeader = request.headers.authorization;
    const cronSecret = getRequiredEnv('CRON_SECRET');
    const expectedToken = `Bearer ${cronSecret}`;
    const querySecret = getQueryValue(request.query.secret as any);
    
    if (authHeader !== expectedToken && querySecret !== cronSecret) {
      log.warn("Unauthorized attempt to run reconciliation job", { 
        ip: request.headers['x-forwarded-for'],
        userAgent: request.headers['user-agent']
      });
      throw new ApiError(401, "Unauthorized");
    }

    const stats = await runReconciliationJob();
    log.info("Reconciliation job completed", { stats });
    
    return sendJson(response, 200, { success: true, stats });
  });
}
