import type { VercelRequest, VercelResponse } from "@vercel/node";
import { withApiHandler, json, assertMethod } from "../../../src/server/shared/http.js";
import { requireAdminAccess } from "../../../src/server/admin/guards.js";
import { requireTenantFromRequest } from "../../../src/server/tenancy/resolver.js";
import { getMercadoPagoConnectUrl } from "../../../src/server/integrations/mercadopago/oauth.js";
import { requireCsrf } from "../../../src/server/security/csrf.js";

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return withApiHandler(request, response, async ({ requestId }) => {
    assertMethod(request, ["POST"]);
    requireCsrf(request);

    const { tenant } = await requireTenantFromRequest(request);
    const access = await requireAdminAccess(request);
    const body = (
      typeof request.body === "string" ? JSON.parse(request.body || "{}") : (request.body ?? {})
    ) as { returnTo?: string | null };
    const tenantUserId = access.type === "session" ? access.userId : "admin-api";

    const result = await getMercadoPagoConnectUrl(tenant.id, {
      tenantUserId,
      returnTo: body.returnTo || "/admin/pagamentos/configuracoes",
    });

    return json(response, 200, {
      authorizationUrl: result.authorizationUrl,
      requestId,
    });
  });
}
