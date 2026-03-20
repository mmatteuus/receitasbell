import type { VercelRequest, VercelResponse } from "@vercel/node";
import { assertMethod, readJsonBody, sendJson, withApiHandler } from "../../../src/server/http.js";
import { bootstrapTenantAdmin } from "../../../src/server/admin/auth.js";

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return withApiHandler(request, response, async () => {
    assertMethod(request, ["POST"]);
    const body = await readJsonBody<{
      tenantName: string;
      tenantSlug: string;
      adminEmail: string;
      adminPassword: string;
      host?: string | null;
    }>(request);
    const session = await bootstrapTenantAdmin(request, response, body);
    return sendJson(response, 201, session);
  });
}
