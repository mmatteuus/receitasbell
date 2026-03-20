import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireTenantAdminAccess } from "../../../src/server/admin/tenantAccess.js";
import { disconnectTenantMercadoPagoConnection } from "../../../src/server/mercadopago/connections.js";
import { assertMethod, sendJson, withApiHandler } from "../../../src/server/http.js";

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return withApiHandler(request, response, async () => {
    assertMethod(request, ["POST"]);
    const access = await requireTenantAdminAccess(request);
    const connection = await disconnectTenantMercadoPagoConnection({
      tenantId: access.tenant.id,
      actorUserId: access.tenantUser.id,
    });

    return sendJson(response, 200, {
      disconnected: true,
      connectionStatus: connection?.status ?? "disconnected",
    });
  });
}
