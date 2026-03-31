import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withApiHandler, sendJson, ApiError, requireCronAuth } from '../../src/server/shared/http.js';
import { runConsistencyJob } from '../../src/server/jobs/maintenance.js';

export default withApiHandler(async (request, response) => {
  requireCronAuth(request);
  await runConsistencyJob();
  return sendJson(response, 200, { success: true });
});
