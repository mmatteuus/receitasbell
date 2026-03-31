// api/health.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { withApiHandler, json } from "../src/server/shared/http.js";

export default withApiHandler(async (req, res, { requestId }) => {
  return json(res, 200, {
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    requestId,
    env: process.env.NODE_ENV || "development"
  });
});
