import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Redis } from "@upstash/redis";
import { withApiHandler, sendJson, assertMethod } from "../../src/server/shared/http.js";
import { env } from "../../src/server/shared/env.js";
import { getRateLimitBackend } from "../../src/server/shared/rateLimit.js";
import { baserowFetch } from "../../src/server/integrations/baserow/client.js";
import { baserowTables } from "../../src/server/integrations/baserow/tables.js";

type CheckStatus = "ok" | "degraded" | "fail";
type ReadyStatus = "ready" | "degraded" | "unavailable";

function envStatus(names: Array<[string, string | undefined]>) {
  const missing = names.filter(([, value]) => !value || !String(value).trim()).map(([name]) => name);
  return {
    status: missing.length === 0 ? "ok" : "fail",
    missing,
  } as const;
}

async function pingTable(tableId: number, endpoint: string) {
  await baserowFetch(
    `/api/database/rows/table/${tableId}/?user_field_names=true&size=1`,
    {},
    { endpoint, idempotent: true },
  );
}

function toCheck(status: CheckStatus, details: Record<string, unknown>) {
  return { status, ...details };
}

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return withApiHandler(request, response, async ({ logger: log, requestId }) => {
    assertMethod(request, ["GET"]);

    const criticalEnv = envStatus([
      ["APP_BASE_URL", env.APP_BASE_URL],
      ["ADMIN_API_SECRET", env.ADMIN_API_SECRET],
      ["CRON_SECRET", env.CRON_SECRET],
      ["BASEROW_API_TOKEN", env.BASEROW_API_TOKEN],
      ["APP_COOKIE_SECRET", env.APP_COOKIE_SECRET],
      ["ENCRYPTION_KEY", env.ENCRYPTION_KEY],
      ["BASEROW_TABLE_TENANTS", env.BASEROW_TABLE_TENANTS],
      ["BASEROW_TABLE_USERS", env.BASEROW_TABLE_USERS],
      ["BASEROW_TABLE_TENANT_USERS", env.BASEROW_TABLE_TENANT_USERS],
      ["BASEROW_TABLE_RECIPES", env.BASEROW_TABLE_RECIPES],
      ["BASEROW_TABLE_CATEGORIES", env.BASEROW_TABLE_CATEGORIES],
      ["BASEROW_TABLE_SETTINGS", env.BASEROW_TABLE_SETTINGS],
      ["BASEROW_TABLE_PAYMENT_ORDERS", env.BASEROW_TABLE_PAYMENT_ORDERS],
      ["BASEROW_TABLE_PAYMENT_EVENTS", env.BASEROW_TABLE_PAYMENT_EVENTS],
      ["BASEROW_TABLE_RECIPE_PURCHASES", env.BASEROW_TABLE_RECIPE_PURCHASES],
      ["BASEROW_TABLE_AUDIT_LOGS", env.BASEROW_TABLE_AUDIT_LOGS],
      ["BASEROW_TABLE_SESSIONS", env.BASEROW_TABLE_SESSIONS],
      ["BASEROW_TABLE_MAGIC_LINKS", env.BASEROW_TABLE_MAGIC_LINKS],
      ["MERCADO_PAGO_CLIENT_ID", env.MERCADO_PAGO_CLIENT_ID],
      ["MERCADO_PAGO_CLIENT_SECRET", env.MERCADO_PAGO_CLIENT_SECRET],
    ]);

    const optionalEnv = envStatus([
      ["RESEND_API_KEY", env.RESEND_API_KEY],
      ["UPSTASH_REDIS_REST_URL", process.env.UPSTASH_REDIS_REST_URL],
      ["UPSTASH_REDIS_REST_TOKEN", process.env.UPSTASH_REDIS_REST_TOKEN],
    ]);

    const tableChecks = await Promise.allSettled([
      pingTable(Number(env.BASEROW_TABLE_TENANTS), "baserow.tenants"),
      pingTable(Number(env.BASEROW_TABLE_USERS), "baserow.users"),
      pingTable(Number(env.BASEROW_TABLE_TENANT_USERS), "baserow.tenant_users"),
      pingTable(Number(env.BASEROW_TABLE_RECIPES), "baserow.recipes"),
      pingTable(Number(env.BASEROW_TABLE_CATEGORIES), "baserow.categories"),
      pingTable(Number(env.BASEROW_TABLE_SETTINGS), "baserow.settings"),
      pingTable(Number(env.BASEROW_TABLE_PAYMENT_ORDERS), "baserow.payment_orders"),
      pingTable(Number(env.BASEROW_TABLE_PAYMENT_EVENTS), "baserow.payment_events"),
      pingTable(Number(env.BASEROW_TABLE_RECIPE_PURCHASES), "baserow.recipe_purchases"),
      pingTable(Number(env.BASEROW_TABLE_AUDIT_LOGS), "baserow.audit_logs"),
      pingTable(Number(env.BASEROW_TABLE_SESSIONS), "baserow.sessions"),
      pingTable(Number(env.BASEROW_TABLE_MAGIC_LINKS), "baserow.magic_links"),
    ]);

    const baserowFailures = tableChecks
      .map((result, index) => ({ result, index }))
      .filter(({ result }) => result.status === "rejected")
      .map(({ index, result }) => ({
        table: [
          "tenants",
          "users",
          "tenantUsers",
          "recipes",
          "categories",
          "settings",
          "paymentOrders",
          "paymentEvents",
          "recipePurchases",
          "auditLogs",
          "sessions",
          "magicLinks",
        ][index],
        reason: result.status === "rejected" ? (result.reason instanceof Error ? result.reason.message : String(result.reason)) : null,
      }));

    const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
    const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;
    const rateLimitBackend = getRateLimitBackend();
    let rateLimitCheck: { status: CheckStatus; backend: string; reason?: string } = {
      status: "degraded",
      backend: rateLimitBackend,
      reason: "upstash_not_configured",
    };

    if (upstashUrl && upstashToken) {
      try {
        const redis = new Redis({ url: upstashUrl, token: upstashToken });
        const pingResult = await redis.ping();
        rateLimitCheck = {
          status: rateLimitBackend === "memory" ? "degraded" : "ok",
          backend: rateLimitBackend,
          reason: rateLimitBackend === "memory" ? "runtime_fallback_active" : undefined,
        };
        if (pingResult !== "PONG" && pingResult !== "pong") {
          log.warn("health.ready.rate_limit_ping_unexpected", {
            action: "health.ready.rate_limit_ping_unexpected",
            pingResult,
          });
        }
      } catch (error) {
        rateLimitCheck = {
          status: "fail",
          backend: rateLimitBackend,
          reason: error instanceof Error ? error.message : String(error),
        };
      }
    }

    const emailCheck: { status: CheckStatus; reason?: string } = optionalEnv.missing.includes("RESEND_API_KEY")
      ? { status: "degraded", reason: "email_disabled" }
      : { status: "ok" };

    const baserowCheck: { status: CheckStatus; reason?: string; failures: Array<{ table: string; reason: string | null }> } =
      baserowFailures.length > 0
        ? { status: "fail", reason: "table_access_failed", failures: baserowFailures }
        : { status: "ok", failures: [] };

    const criticalIssues = [
      ...(criticalEnv.status === "fail" ? criticalEnv.missing.map((name) => `missing_env:${name}`) : []),
      ...(baserowCheck.status === "fail" ? ["baserow_access"] : []),
    ];

    const degradedIssues = [
      ...(rateLimitCheck.status === "degraded" ? ["rate_limit_backend_memory"] : []),
      ...(emailCheck.status === "degraded" ? ["email_disabled"] : []),
    ];

    const mpCheck = criticalEnv.missing.includes("MERCADO_PAGO_CLIENT_ID") || criticalEnv.missing.includes("MERCADO_PAGO_CLIENT_SECRET")
      ? { status: "fail" as CheckStatus, reason: "mercado_pago_config_missing" }
      : { status: "ok" as CheckStatus };

    const status: ReadyStatus = criticalIssues.length > 0 || mpCheck.status === "fail" || rateLimitCheck.status === "fail"
      ? "unavailable"
      : degradedIssues.length > 0 || rateLimitCheck.status === "degraded"
        ? "degraded"
        : "ready";

    if (status === "unavailable") {
      log.error("health.ready.unavailable", {
        action: "health.ready.unavailable",
        criticalIssues,
        baserowFailures,
        mpCheck,
      });
    }

    return sendJson(response, status === "unavailable" ? 503 : 200, {
      status,
      version: process.env.VERCEL_GIT_COMMIT_SHA || "dev",
      checks: {
        env: toCheck(criticalEnv.status === "ok" ? "ok" : "fail", {
          critical: criticalEnv.missing.length === 0,
          missing: criticalEnv.missing,
        }),
        baserow: toCheck(baserowCheck.status, {
          failures: baserowCheck.failures,
        }),
        mp: toCheck(mpCheck.status, mpCheck.status === "fail" ? { reason: mpCheck.reason } : {}),
        rateLimit: toCheck(rateLimitCheck.status, {
          backend: rateLimitCheck.backend,
          reason: rateLimitCheck.reason,
        }),
        email: toCheck(emailCheck.status, {
          reason: emailCheck.reason,
        }),
      },
      timestamp: new Date().toISOString(),
      requestId,
    });
  });
}
