import type { VercelRequest, VercelResponse } from "@vercel/node";
import { assertMethod, sendJson, withApiHandler } from "../../../src/server/http.js";
import { logoutAdmin } from "../../../src/server/admin/auth.js";

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return withApiHandler(request, response, async () => {
    assertMethod(request, ["POST", "DELETE"]);
    const session = await logoutAdmin(request, response);
    return sendJson(response, 200, session);
  });
}
