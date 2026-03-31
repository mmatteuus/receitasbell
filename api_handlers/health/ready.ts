import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Redis } from '@upstash/redis';
import { withApiHandler, sendJson, assertMethod } from '../../src/server/shared/http.js';
import { env } from '../../src/server/shared/env.js';
import { getRateLimitBackend } from '../../src/server/shared/rateLimit.js';
import { baserowFetch } from '../../src/server/integrations/baserow/client.js';

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

async function pingTable(tableId: string | undefined, endpoint: string) {
  if (!tableId) return;
  await baserowFetch(
    `/api/database/rows/table/${tableId}/?user_field_names=true&size=1`,
    {},
    { endpoint, idempotent: true }
  );
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
      ['BASEROW_API_TOKEN', env.BASEROW_API_TOKEN],
      ['APP_COOKIE_SECRET', env.APP_COOKIE_SECRET],
      ['ENCRYPTION_KEY', env.ENCRYPTION_KEY],
      ['BASEROW_TABLE_TENANTS', env.BASEROW_TABLE_TENANTS],
      ['BASEROW_TABLE_USERS', env.BASEROW_TABLE_USERS],
      ['BASEROW_TABLE_RECIPES', env.BASEROW_TABLE_RECIPES],
      ['BASEROW_TABLE_CATEGORIES', env.BASEROW_TABLE_CATEGORIES],
      ['BASEROW_TABLE_SETTINGS', env.BASEROW_TABLE_SETTINGS],
      ['BASEROW_TABLE_PAYMENT_EVENTS', env.BASEROW_TABLE_PAYMENT_EVENTS],
      ['BASEROW_TABLE_RECIPE_PURCHASES', env.BASEROW_TABLE_RECIPE_PURCHASES],
      ['BASEROW_TABLE_AUDIT_LOGS', env.BASEROW_TABLE_AUDIT_LOGS],
      ['BASEROW_TABLE_MAGIC_LINKS', env.BASEROW_TABLE_MAGIC_LINKS],
    ]);

    const optionalEnv = envStatus([
      ['RESEND_API_KEY', env.RESEND_API_KEY],
      ['UPSTASH_REDIS_REST_URL', process.env.UPSTASH_REDIS_REST_URL],
      ['UPSTASH_REDIS_REST_TOKEN', process.env.UPSTASH_REDIS_REST_TOKEN],
      ['BASEROW_TABLE_SESSIONS', env.BASEROW_TABLE_SESSIONS],
      ['BASEROW_TABLE_PAYMENT_ORDERS', env.BASEROW_TABLE_PAYMENT_ORDERS],
    ]);

    const tableChecks = await Promise.allSettled([
      pingTable(env.BASEROW_TABLE_TENANTS, 'baserow.tenants'),
      pingTable(env.BASEROW_TABLE_USERS, 'baserow.users'),
      pingTable(env.BASEROW_TABLE_RECIPES, 'baserow.recipes'),
      pingTable(env.BASEROW_TABLE_CATEGORIES, 'baserow.categories'),
      pingTable(env.BASEROW_TABLE_SETTINGS, 'baserow.settings'),
      pingTable(env.BASEROW_TABLE_PAYMENT_EVENTS, 'baserow.payment_events'),
      pingTable(env.BASEROW_TABLE_RECIPE_PURCHASES, 'baserow.recipe_purchases'),
      pingTable(env.BASEROW_TABLE_AUDIT_LOGS, 'baserow.audit_logs'),
      pingTable(env.BASEROW_TABLE_MAGIC_LINKS, 'baserow.magic_links'),
    ]);

    const tableNames = [
      'tenants',
      'users',
      'recipes',
      'categories',
      'settings',
      'paymentEvents',
      'recipePurchases',
      'auditLogs',
      'magicLinks',
    ];

    const baserowFailures = tableChecks
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
    const rateLimitBackend = getRateLimitBackend();
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
          status: rateLimitBackend === 'memory' ? 'degraded' : 'ok',
          backend: rateLimitBackend,
          reason: rateLimitBackend === 'memory' ? 'runtime_fallback_active' : undefined,
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

    const baserowCheck: {
      status: CheckStatus;
      reason?: string;
      failures: Array<{ table: string; reason: string | null }>;
    } =
      baserowFailures.length > 0
        ? { status: 'fail', reason: 'table_access_failed', failures: baserowFailures }
        : { status: 'ok', failures: [] };

    const criticalIssues = [
      ...(criticalEnv.status === 'fail'
        ? criticalEnv.missing.map((name) => `missing_env:${name}`)
        : []),
      ...(baserowCheck.status === 'fail' ? ['baserow_access'] : []),
    ];

    const degradedIssues = [
      ...(rateLimitCheck.status === 'degraded' ? ['rate_limit_backend_memory'] : []),
      ...(emailCheck.status === 'degraded' ? ['email_disabled'] : []),
      ...(optionalEnv.missing.includes('BASEROW_TABLE_SESSIONS') ? ['sessions_table_missing'] : []),
      ...(optionalEnv.missing.includes('BASEROW_TABLE_PAYMENT_ORDERS')
        ? ['payment_orders_table_missing']
        : []),
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
        baserowFailures,
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
        baserow: toCheck(baserowCheck.status, {
          failures: baserowCheck.failures,
        }),
        rateLimit: toCheck(rateLimitCheck.status, {
          backend: rateLimitCheck.backend,
          reason: rateLimitCheck.reason,
        }),
        email: toCheck(emailCheck.status, {
          reason: emailCheck.reason,
        }),
        sessions: toCheck(
          optionalEnv.missing.includes('BASEROW_TABLE_SESSIONS') ? 'degraded' : 'ok',
          optionalEnv.missing.includes('BASEROW_TABLE_SESSIONS')
            ? { reason: 'sessions_table_not_configured' }
            : {}
        ),
        paymentOrders: toCheck(
          optionalEnv.missing.includes('BASEROW_TABLE_PAYMENT_ORDERS') ? 'degraded' : 'ok',
          optionalEnv.missing.includes('BASEROW_TABLE_PAYMENT_ORDERS')
            ? { reason: 'payment_orders_table_not_configured' }
            : {}
        ),
      },
      timestamp: new Date().toISOString(),
      requestId,
    });
  }
);
