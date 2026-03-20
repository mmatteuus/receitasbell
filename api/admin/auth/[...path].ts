import type { VercelRequest, VercelResponse } from "@vercel/node";
import { assertMethod, readJsonBody, sendJson, withApiHandler, sendError } from "../../../src/server/http.js";
import { bootstrapTenantAdmin, loginAdmin, logoutAdmin, readAdminSession } from "../../../src/server/admin/auth.js";
import { startMercadoPagoLoginFlow } from "../../../src/server/admin/auth/mp-login.js";

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

    // GET/POST/DELETE /api/admin/auth/session
    if (action === "session") {
      assertMethod(request, ["GET", "POST", "DELETE"]);

      if (request.method === "GET") {
        sendJson(response, 200, await readAdminSession(request));
        return;
      }

      if (request.method === "POST") {
        const body = await readJsonBody<{ email?: string; password?: string }>(request);
        const session = await loginAdmin(request, response, body);
        sendJson(response, 200, session);
        return;
      }

      const session = await logoutAdmin(request, response);
      sendJson(response, 200, session);
      return;
    }

    // POST /api/admin/auth/login (alias)
    if (action === "login") {
      assertMethod(request, ["POST"]);
      const body = await readJsonBody<{ email?: string; password?: string }>(request);
      const session = await loginAdmin(request, response, body);
      sendJson(response, 200, session);
      return;
    }

    // POST /api/admin/auth/logout (alias)
    if (action === "logout") {
      assertMethod(request, ["POST", "DELETE"]);
      const session = await logoutAdmin(request, response);
      sendJson(response, 200, session);
      return;
    }

    // POST /api/admin/auth/bootstrap
    if (action === "bootstrap") {
      assertMethod(request, ["POST"]);
      const body = await readJsonBody<{
        tenantName: string;
        tenantSlug: string;
        adminEmail: string;
        adminPassword: string;
        host?: string | null;
      }>(request);
      const session = await bootstrapTenantAdmin(request, response, body);
      sendJson(response, 201, session);
      return;
    }

    // GET /api/admin/auth/mp-login
    if (action === "mp-login") {
      assertMethod(request, ["GET"]);
      try {
        const returnTo = request.query.returnTo as string | undefined;
        const { authorizationUrl } = await startMercadoPagoLoginFlow({ returnTo });
        response.redirect(authorizationUrl);
      } catch (error) {
        sendError(response, error);
      }
    }

    return sendJson(response, 404, { error: "Not found" });
  });
}
