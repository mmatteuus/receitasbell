import type { VercelRequest, VercelResponse } from "@vercel/node";
import { assertMethod, readJsonBody, json, withApiHandler } from "../../../src/server/shared/http.js";
import { bootstrapTenantAdmin } from "../../../src/server/admin/auth.js";

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return withApiHandler(request, response, async ({ requestId }) => {
    assertMethod(request, ["POST"]);
    const body = await readJsonBody<{
      tenantName?: string;
      tenantSlug?: string;
      adminEmail?: string;
      adminPassword?: string;
    }>(request);
    const session = await bootstrapTenantAdmin(request, response, body);
    return json(response, 201, { ...session, requestId });
  });
}
