import type { VercelRequest, VercelResponse } from "@vercel/node";
import { assertMethod, readJsonBody, sendJson, withApiHandler } from "../../../src/server/http.js";
import { loginAdmin } from "../../../src/server/admin/auth.js";

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return withApiHandler(request, response, async () => {
    assertMethod(request, ["POST"]);
    const body = await readJsonBody<{ email?: string; password?: string }>(request);
    const session = await loginAdmin(request, response, body);
    return sendJson(response, 200, session);
  });
}
