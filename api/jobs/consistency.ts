import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withApiHandler, sendJson, ApiError, getQueryValue, getRequiredEnv } from '../../src/server/http.js';
import { runConsistencyJob } from '../../src/server/jobs/maintenance.ts';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return withApiHandler(request, response, async (log) => {
    const authHeader = request.headers.authorization;
    const expectedToken = `Bearer ${getRequiredEnv('CRON_SECRET')}`;
    const querySecret = getQueryValue(request.query.secret as any);
    
    if (authHeader !== expectedToken && querySecret !== getRequiredEnv('CRON_SECRET')) {
      throw new ApiError(401, 'Unauthorized job request');
    }

    const result = await runConsistencyJob();
    return sendJson(response, 200, { success: true, ...result });
  });
}
