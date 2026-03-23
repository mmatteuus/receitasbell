import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withApiHandler, sendJson } from '../src/server/http.js';
import { fetchBaserow } from '../src/server/baserow/client.js';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return withApiHandler(request, response, async (log) => {
    const checks: any = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      services: {
        database: 'unknown',
      }
    };

    try {
      await fetchBaserow('/api/database/tables/', { method: 'GET' });
      checks.services.database = 'OK';
    } catch {
      checks.services.database = 'FAIL';
    }

    const allOk = Object.values(checks.services).every(v => v === 'OK');
    return sendJson(response, allOk ? 200 : 503, checks);
  });
}
