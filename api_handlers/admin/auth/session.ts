import type { VercelRequest, VercelResponse } from "@vercel/node";
import { assertMethod, readJsonBody, json, withApiHandler } from "../../../src/server/shared/http.js";
import { loginAdmin, logoutAdmin, readAdminSession } from "../../../src/server/admin/auth.js";

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return withApiHandler(request, response, async ({ requestId }) => {
    assertMethod(request, ["GET", "POST", "DELETE"]);

    if (request.method === "GET") {
      return json(response, 200, { ...(await readAdminSession(request)), requestId });
    }

    if (request.method === "POST") {
      const body = await readJsonBody<{ email?: string; password?: string }>(request);
      const session = await loginAdmin(request, response, body);
      return json(response, 200, { ...session, requestId });
    }

    // DELETE
    const session = await logoutAdmin(request, response);
    return json(response, 200, { ...session, requestId });
  });
}
