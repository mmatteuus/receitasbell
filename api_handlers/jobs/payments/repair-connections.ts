import type { VercelRequest, VercelResponse } from "@vercel/node";
import { withApiHandler, json, requireCronAuth, assertMethod } from "../../../src/server/shared/http.js";
import { repairMercadoPagoActiveConnections } from "../../../src/server/integrations/mercadopago/connections.js";

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return withApiHandler(request, response, async ({ requestId }) => {
    assertMethod(request, ["GET"]);
    requireCronAuth(request);
    const stats = await repairMercadoPagoActiveConnections();
    return json(response, 200, {
      success: true,
      stats,
      requestId,
    });
  });
}
