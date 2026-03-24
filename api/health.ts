import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withApiHandler, sendJson, assertMethod } from '../src/server/shared/http.js';
import { validateCriticalEnv } from '../src/server/shared/env.js';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return withApiHandler(request, response, async (log) => {
    assertMethod(request, ['GET']);

    const url = new URL(request.url || '', 'http://localhost');
    const path = url.pathname;

    // Liveness probe
    if (path.endsWith('/live')) {
      return sendJson(response, 200, { status: 'live', timestamp: new Date().toISOString() });
    }

    const checks: Record<string, any> = {
      env: false,
      storage: false,
      payments: false,
    };

    // 1. Validate Critical Env
    try {
      validateCriticalEnv();
      checks.env = true;
    } catch (e: any) {
      log.error('Health Check Fail: Critical Env Missing', { error: e.message });
      checks.env = false;
    }

    // 2. Storage Check (Baserow)
    try {
      const baserowRes = await fetch(`${process.env.BASEROW_API_URL || 'https://api.baserow.io'}/api/database/tables/`, {
        headers: { Authorization: `Token ${process.env.BASEROW_API_TOKEN}` }
      });
      checks.storage = baserowRes.ok;
      if (!baserowRes.ok) {
        log.warn('Health Check Warning: Baserow storage not OK', { status: baserowRes.status });
      }
    } catch (e: any) {
      log.error('Health Check Fail: Storage Connectivity', { error: e.message });
      checks.storage = false;
    }

    // 3. Payments Check (Presence of credentials)
    // In a multi-tenant app, we might check at least the platform/global config
    // For now, check if the basic Baserow table for payments is configured
    checks.payments = !!process.env.BASEROW_TABLE_PAYMENTS;

    const isReady = checks.env && checks.storage;

    // Readiness probe
    if (path.endsWith('/ready')) {
      return sendJson(response, isReady ? 200 : 503, { 
        status: isReady ? 'ready' : 'not_ready', 
        checks,
        version: process.env.VERCEL_GIT_COMMIT_SHA || 'dev'
      });
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
