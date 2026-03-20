import type { VercelRequest, VercelResponse } from "@vercel/node";
import { assertMethod, sendJson, withApiHandler } from "../../../src/server/http.js";
import { readAdminSession } from "../../../src/server/admin/auth.js";

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return withApiHandler(request, response, async () => {
    assertMethod(request, ["GET"]);
    const session = await readAdminSession(request);
    return sendJson(response, 200, session);
  });
}
