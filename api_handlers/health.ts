// api/health.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { withApiHandler, json } from "../src/server/shared/http.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return withApiHandler(req, res, async ({ requestId }) => {
    return json(res, 200, {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      requestId,
      env: process.env.NODE_ENV || "development"
    });
  });
}
