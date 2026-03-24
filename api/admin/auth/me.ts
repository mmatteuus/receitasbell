import type { VercelRequest, VercelResponse } from "@vercel/node";
import { withApiHandler, json } from "../../../src/server/shared/http.js";
import { getSession } from "../../../src/server/auth/sessions.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return withApiHandler(req, res, async ({ requestId }) => {
    const s = await getSession(req);
    if (!s || (s.role !== "admin" && s.role !== "owner")) {
      return json(res, 401, { success: false, error: { message: "Not authenticated or unauthorized" }, requestId });
    }
    return json(res, 200, { success: true, data: { admin: s }, requestId });
  });
}
