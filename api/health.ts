import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withApiHandler, sendJson, assertMethod } from '../src/server/shared/http.js';
import { BASEROW_TABLES } from '../src/server/integrations/baserow/client.js';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return withApiHandler(request, response, async () => {
    assertMethod(request, ['GET']);

    const url = new URL(request.url || '', 'http://localhost');
    const path = url.pathname;

    // Liveness probe
    if (path.endsWith('/live')) {
      return sendJson(response, 200, { status: 'live', timestamp: new Date().toISOString() });
    }

    const checks: Record<string, any> = {
      env: !!process.env.BASEROW_TOKEN && !!process.env.BASEROW_DATABASE_ID,
      storage: false,
    };

    try {
      // Basic connectivity check to Baserow
      const baserowResponse = await fetch(`${process.env.BASEROW_API_URL || 'https://api.baserow.io'}/api/database/tables/`, {
        headers: { Authorization: `Token ${process.env.BASEROW_TOKEN}` }
      });
      checks.storage = baserowResponse.ok;
    } catch {
      checks.storage = false;
    }

    const isReady = Object.values(checks).every(Boolean);

    // Readiness probe
    if (path.endsWith('/ready')) {
      return sendJson(response, isReady ? 200 : 503, { status: isReady ? 'ready' : 'not_ready', checks });
    }

    // Full health check
    return sendJson(response, isReady ? 200 : 503, {
      status: isReady ? 'healthy' : 'unhealthy',
      version: process.env.VERCEL_GIT_COMMIT_SHA || 'dev',
      checks,
      timestamp: new Date().toISOString()
    });
  });
}
