import type { VercelRequest, VercelResponse } from "@vercel/node";
import { withApiHandler, json, assertMethod } from "../../src/server/shared/http.js";
import { revokeSession } from "../../src/server/auth/sessions.js";

export default withApiHandler(async (req, res, { requestId }) => {
  assertMethod(req, ["POST"]);
  await revokeSession(req, res);
  return json(res, 200, { success: true, data: { ok: true }, requestId });
});
