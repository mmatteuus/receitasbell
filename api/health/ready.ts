import type { VercelRequest, VercelResponse } from "@vercel/node";
import { withApiHandler, sendJson, assertMethod } from "../../src/server/shared/http.js";
import { validateCriticalEnv, env } from "../../src/server/shared/env.js";

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return withApiHandler(request, response, async ({ logger: log, requestId }) => {
    assertMethod(request, ["GET"]);

    const checks: Record<string, any> = {
      env: false,
      baserow: false,
      tablesConfigured: false,
    };

    try {
      validateCriticalEnv();
      checks.env = true;
    } catch (e: any) {
      checks.env = false;
      log.error("Critical env missing", { error: e?.message });
    }

    try {
      // ping simples via Baserow: lista tables
      const res = await fetch(`${env.BASEROW_API_URL}/api/database/tables/`, {
        headers: { Authorization: `Token ${env.BASEROW_API_TOKEN}` },
      });
      checks.baserow = res.ok;
    } catch (e: any) {
      checks.baserow = false;
      log.error("Baserow connectivity failed", { error: e?.message });
    }

    checks.tablesConfigured = Boolean(env.BASEROW_TABLE_TENANTS && env.BASEROW_TABLE_RECIPES && env.BASEROW_TABLE_PAYMENT_ORDERS);

    const ready = checks.env && checks.baserow && checks.tablesConfigured;

    return sendJson(response, ready ? 200 : 503, {
      status: ready ? "healthy" : "unhealthy",
      version: process.env.VERCEL_GIT_COMMIT_SHA || "dev",
      checks,
      timestamp: new Date().toISOString(),
      requestId
    });
  });
}
