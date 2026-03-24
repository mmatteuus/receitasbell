import type { VercelRequest, VercelResponse } from "@vercel/node";
import { assertMethod, readJsonBody, sendJson, withApiHandler } from "../../../src/server/shared/http.js";
import { bootstrapTenantAdmin, loginAdmin, logoutAdmin, readAdminSession } from "../../../src/server/admin/auth.js";

function getPathSegments(request: VercelRequest) {
  const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);
  const segments = url.pathname.split("/").filter(Boolean);
  const idx = segments.indexOf("auth");
  return idx >= 0 ? segments.slice(idx + 1) : [];
}

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return withApiHandler(request, response, async () => {
    const segments = getPathSegments(request);
    const action = segments[0] || "session";

    if (action === "session") {
      assertMethod(request, ["GET", "POST", "DELETE"]);

      if (request.method === "GET") {
        return sendJson(response, 200, await readAdminSession(request));
      }

      if (request.method === "POST") {
        const body = await readJsonBody<{ email?: string; password?: string }>(request);
        const session = await loginAdmin(request, response, body);
        return sendJson(response, 200, session);
      }

      const session = await logoutAdmin(request, response);
      return sendJson(response, 200, session);
    }

    if (action === "login") {
      assertMethod(request, ["POST"]);
      const body = await readJsonBody<{ email?: string; password?: string }>(request);
      const session = await loginAdmin(request, response, body);
      return sendJson(response, 200, session);
    }

    if (action === "logout") {
      assertMethod(request, ["POST", "DELETE"]);
      const session = await logoutAdmin(request, response);
      return sendJson(response, 200, session);
    }

    if (action === "bootstrap") {
      assertMethod(request, ["POST"]);
      const body = await readJsonBody<any>(request);
      const session = await bootstrapTenantAdmin(request, response, body);
      return sendJson(response, 201, session);
    }

    return sendJson(response, 404, { error: "Not found" });
  });
}
