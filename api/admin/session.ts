import type { VercelRequest, VercelResponse } from "@vercel/node";
import { assertMethod, readJsonBody, sendJson, withApiHandler } from "../../src/server/http.js";
import { loginAdmin, logoutAdmin, readAdminSession } from "../../src/server/admin/auth.js";

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return withApiHandler(request, response, async () => {
    assertMethod(request, ["GET", "POST", "DELETE"]);

    if (request.method === "GET") {
      return sendJson(response, 200, await readAdminSession(request));
    }

    if (request.method === "POST") {
      const body = await readJsonBody<{ email?: string; password?: string }>(request);
      return sendJson(response, 200, await loginAdmin(request, response, body));
    }

    return sendJson(response, 200, await logoutAdmin(request, response));
  });
}
