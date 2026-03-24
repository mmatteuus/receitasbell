import type { VercelRequest, VercelResponse } from "@vercel/node";
import { assertMethod, readJsonBody, json, withApiHandler, ApiError } from "../../../src/server/shared/http.js";
import { bootstrapTenantAdmin, loginAdmin, logoutAdmin, readAdminSession } from "../../../src/server/admin/auth.js";

function getPathSegments(request: VercelRequest) {
  const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);
  const segments = url.pathname.split("/").filter(Boolean);
  const idx = segments.indexOf("auth");
  return idx >= 0 ? segments.slice(idx + 1) : [];
}

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return withApiHandler(request, response, async ({ requestId }) => {
    const segments = getPathSegments(request);
    const action = segments[0] || "session";

    if (action === "session") {
      assertMethod(request, ["GET", "POST", "DELETE"]);

      if (request.method === "GET") {
        return json(response, 200, { ...(await readAdminSession(request)), requestId });
      }

      if (request.method === "POST") {
        const body = await readJsonBody<{ email?: string; password?: string }>(request);
        const session = await loginAdmin(request, response, body);
        return json(response, 200, { ...session, requestId });
      }

      const session = await logoutAdmin(request, response);
      return json(response, 200, { ...session, requestId });
    }

    if (action === "login") {
      assertMethod(request, ["POST"]);
      const body = await readJsonBody<{ email?: string; password?: string }>(request);
      const session = await loginAdmin(request, response, body);
      return json(response, 200, { ...session, requestId });
    }

    if (action === "logout") {
      assertMethod(request, ["POST", "DELETE"]);
      const session = await logoutAdmin(request, response);
      return json(response, 200, { ...session, requestId });
    }

    if (action === "bootstrap") {
      assertMethod(request, ["POST"]);
      const body = await readJsonBody<any>(request);
      const session = await bootstrapTenantAdmin(request, response, body);
      return json(response, 201, { ...session, requestId });
    }

    throw new ApiError(404, "Not found");
  });
}
