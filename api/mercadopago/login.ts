import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireTenantAdminAccess } from "../../src/server/admin/tenantAccess.js";
import { createMercadoPagoOAuthStart } from "../../src/server/mercadopago/oauth.js";
import { assertMethod, withApiHandler } from "../../src/server/http.js";

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return withApiHandler(request, response, async () => {
    assertMethod(request, ["GET"]);
    const access = await requireTenantAdminAccess(request);
    const returnTo = Array.isArray(request.query.returnTo)
      ? request.query.returnTo[0]
      : request.query.returnTo;
    const oauth = await createMercadoPagoOAuthStart({
      tenantId: access.tenant.id,
      tenantUserId: access.tenantUser.id,
      returnTo: typeof returnTo === "string" ? returnTo : null,
    });

    response.status(302).setHeader("Location", oauth.authorizationUrl).end();
  });
}
