import type { VercelRequest, VercelResponse } from "@vercel/node";
import { withApiHandler, sendJson, assertMethod } from "../../src/server/shared/http.js";
import { validateCriticalEnv, env } from "../../src/server/shared/env.js";

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return withApiHandler(request, response, async ({ logger: log, requestId }) => {
    assertMethod(request, ["GET"]);

    const checks: Record<string, boolean> = {
      env: false,
      baserow: false,
      tablesConfigured: false,
    };

    try {
      validateCriticalEnv();
      checks.env = true;
    } catch (e: unknown) {
      checks.env = false;
      log.error("Critical env missing", e);
    }

    try {
      // Ping real no endpoint de rows usado pela aplicação.
      const base = (env.BASEROW_API_URL || "https://api.baserow.io").replace(/\/$/, "");
      const tableId = env.BASEROW_TABLE_TENANTS;
      if (!tableId) throw new Error("BASEROW_TABLE_TENANTS missing");
      const res = await fetch(`${base}/api/database/rows/table/${tableId}/?user_field_names=true&size=1`, {
        headers: { Authorization: `Token ${env.BASEROW_API_TOKEN}` },
      });
      checks.baserow = res.ok;
    } catch (e: unknown) {
      checks.baserow = false;
      log.error("Baserow connectivity failed", e);
    }

    checks.tablesConfigured = Boolean(env.BASEROW_TABLE_TENANTS && env.BASEROW_TABLE_RECIPES && env.BASEROW_TABLE_PAYMENT_ORDERS);

    const isReady = checks.env && checks.baserow && checks.tablesConfigured;

    return sendJson(response, isReady ? 200 : 503, {
      status: isReady ? "ready" : "not_ready",
      version: process.env.VERCEL_GIT_COMMIT_SHA || "dev",
      checks,
      timestamp: new Date().toISOString(),
      requestId
    });
  });
}
