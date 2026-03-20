import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireTenantAdminAccess } from "../../../src/server/admin/tenantAccess.js";
import { createMercadoPagoOAuthStart } from "../../../src/server/mercadopago/oauth.js";
import { assertMethod, readJsonBody, sendJson, withApiHandler } from "../../../src/server/http.js";

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return withApiHandler(request, response, async () => {
    assertMethod(request, ["POST"]);
    const access = await requireTenantAdminAccess(request);
    const body = await readJsonBody<{ returnTo?: string | null }>(request);
    const oauth = await createMercadoPagoOAuthStart({
      tenantId: access.tenant.id,
      tenantUserId: access.tenantUser.id,
      returnTo: body.returnTo,
    });

    return sendJson(response, 200, {
      authorizationUrl: oauth.authorizationUrl,
    });
  });
}
