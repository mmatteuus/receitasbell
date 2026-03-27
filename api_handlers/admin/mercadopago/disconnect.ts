import type { VercelRequest, VercelResponse } from "@vercel/node";
import { withApiHandler, json, assertMethod } from "../../../src/server/shared/http.js";
import { requireAdminAccess } from "../../../src/server/admin/guards.js";
import { requireTenantFromRequest } from "../../../src/server/tenancy/resolver.js";
import { disconnectTenantMercadoPagoConnection } from "../../../src/server/integrations/mercadopago/connections.js";
import { requireCsrf } from "../../../src/server/security/csrf.js";

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return withApiHandler(request, response, async ({ requestId }) => {
    assertMethod(request, ["POST"]);
    requireCsrf(request);

    const { tenant } = await requireTenantFromRequest(request);
    const access = await requireAdminAccess(request);
    const actorUserId = access.type === "session" ? access.userId : "admin-api";

    await disconnectTenantMercadoPagoConnection({
      tenantId: tenant.id,
      actorUserId,
    });

    return json(response, 200, {
      disconnected: true,
      connectionStatus: "disconnected",
      requestId,
    });
  });
}
