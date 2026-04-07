import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Redis } from '@upstash/redis';
import { withApiHandler, sendJson, assertMethod } from '../../src/server/shared/http.js';
import { env } from '../../src/server/shared/env.js';
import { supabaseAdmin } from '../../src/server/integrations/supabase/client.js';

type CheckStatus = 'ok' | 'degraded' | 'fail';
type ReadyStatus = 'ready' | 'degraded' | 'unavailable';

function envStatus(names: Array<[string, string | undefined]>) {
  const missing = names
    .filter(([, value]) => !value || !String(value).trim())
    .map(([name]) => name);
  return {
    status: missing.length === 0 ? 'ok' : 'fail',
    missing,
  } as const;
}

async function pingSupabaseTable(tableName: string, endpoint: string) {
  await supabaseAdmin.from(tableName).select('id').limit(1);
}

function toCheck(status: CheckStatus, details: Record<string, unknown>) {
  return { status, ...details };
}

export default withApiHandler(
  async (request: VercelRequest, response: VercelResponse, { logger: log, requestId }) => {
    assertMethod(request, ['GET']);

    const criticalEnv = envStatus([
      ['APP_BASE_URL', env.APP_BASE_URL],
      ['ADMIN_API_SECRET', env.ADMIN_API_SECRET],
      ['CRON_SECRET', env.CRON_SECRET],
      ['APP_COOKIE_SECRET', env.APP_COOKIE_SECRET],
      ['ENCRYPTION_KEY', env.ENCRYPTION_KEY],
      ['SUPABASE_URL', env.SUPABASE_URL],
      ['SUPABASE_SERVICE_ROLE_KEY', env.SUPABASE_SERVICE_ROLE_KEY],
    ]);

    const optionalEnv = envStatus([
      ['RESEND_API_KEY', env.RESEND_API_KEY],
      ['UPSTASH_REDIS_REST_URL', process.env.UPSTASH_REDIS_REST_URL],
      ['UPSTASH_REDIS_REST_TOKEN', process.env.UPSTASH_REDIS_REST_TOKEN],
    ]);

    const paymentsEnv = envStatus([
      ['STRIPE_SECRET_KEY', env.STRIPE_SECRET_KEY],
      ['STRIPE_WEBHOOK_SECRET', env.STRIPE_WEBHOOK_SECRET],
    ]);

    const tableChecks = await Promise.allSettled([
      pingSupabaseTable('organizations', 'supabase.organizations'),
      pingSupabaseTable('users', 'supabase.users'),
      pingSupabaseTable('recipes', 'supabase.recipes'),
      pingSupabaseTable('categories', 'supabase.categories'),
      pingSupabaseTable('settings', 'supabase.settings'),
      pingSupabaseTable('audit_logs', 'supabase.audit_logs'),
    ]);

    const tableNames = ['organizations', 'users', 'recipes', 'categories', 'settings', 'auditLogs'];

    const dbFailures = tableChecks
      .map((result, index) => ({ result, index }))
      .filter(({ result }) => result.status === 'rejected')
      .map(({ index, result }) => ({
        table: tableNames[index],
        reason:
          result.status === 'rejected'
            ? result.reason instanceof Error
              ? result.reason.message
              : String(result.reason)
            : null,
      }));

    const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
    const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;
    const rateLimitBackend = upstashUrl && upstashToken ? 'redis' : 'memory';
    let rateLimitCheck: { status: CheckStatus; backend: string; reason?: string } = {
      status: 'degraded',
      backend: rateLimitBackend,
      reason: 'upstash_not_configured',
    };

    if (upstashUrl && upstashToken) {
      try {
        const redis = new Redis({ url: upstashUrl, token: upstashToken });
        const pingResult = await redis.ping();
        rateLimitCheck = {
          status: 'ok',
          backend: rateLimitBackend,
          reason: undefined,
        };
        if (pingResult !== 'PONG' && pingResult !== 'pong') {
          log.warn('health.ready.rate_limit_ping_unexpected', {
            action: 'health.ready.rate_limit_ping_unexpected',
            pingResult,
          });
        }
      } catch (error) {
        rateLimitCheck = {
          status: 'fail',
          backend: rateLimitBackend,
          reason: error instanceof Error ? error.message : String(error),
        };
      }
    }

    const emailCheck: { status: CheckStatus; reason?: string } = optionalEnv.missing.includes(
      'RESEND_API_KEY'
    )
      ? { status: 'degraded', reason: 'email_disabled' }
      : { status: 'ok' };

    const dbCheck: {
      status: CheckStatus;
      reason?: string;
      failures: Array<{ table: string; reason: string | null }>;
    } =
      dbFailures.length > 0
        ? { status: 'fail', reason: 'db_access_failed', failures: dbFailures }
        : { status: 'ok', failures: [] };

    const criticalIssues = [
      ...(criticalEnv.status === 'fail'
        ? criticalEnv.missing.map((name) => `missing_env:${name}`)
        : []),
      ...(dbCheck.status === 'fail' ? ['db_access'] : []),
    ];

    const degradedIssues = [
      ...(rateLimitCheck.status === 'degraded' ? ['rate_limit_backend_memory'] : []),
      ...(emailCheck.status === 'degraded' ? ['email_disabled'] : []),
      ...(paymentsEnv.status === 'fail' ? ['payments_env_incomplete'] : []),
    ];

    const status: ReadyStatus =
      criticalIssues.length > 0 || rateLimitCheck.status === 'fail'
        ? 'unavailable'
        : degradedIssues.length > 0 || rateLimitCheck.status === 'degraded'
          ? 'degraded'
          : 'ready';

    if (status === 'unavailable') {
      log.error('health.ready.unavailable', {
        action: 'health.ready.unavailable',
        criticalIssues,
        dbFailures,
      });
    }

    return sendJson(response, status === 'unavailable' ? 503 : 200, {
      status,
      version: process.env.VERCEL_GIT_COMMIT_SHA || 'dev',
      checks: {
        env: toCheck(criticalEnv.status === 'ok' ? 'ok' : 'fail', {
          critical: criticalEnv.missing.length === 0,
          missing: criticalEnv.missing,
        }),
        database: toCheck(dbCheck.status, {
          failures: dbCheck.failures,
        }),
        rateLimit: toCheck(rateLimitCheck.status, {
          backend: rateLimitCheck.backend,
          reason: rateLimitCheck.reason,
        }),
        payments: toCheck(paymentsEnv.status === 'ok' ? 'ok' : 'degraded', {
          missing: paymentsEnv.missing,
        }),
        email: toCheck(emailCheck.status, {
          reason: emailCheck.reason,
        }),
      },
      timestamp: new Date().toISOString(),
      requestId,
    });
  }
);
