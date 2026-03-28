import type { VercelRequest, VercelResponse } from "@vercel/node";
import { assertMethod, json, withApiHandler } from "../../src/server/shared/http.js";
import { requireTenantFromRequest } from "../../src/server/tenancy/resolver.js";
import { getCheckoutPaymentConfig } from "../../src/server/payments/direct.js";

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return withApiHandler(request, response, async ({ requestId }) => {
    assertMethod(request, ["GET"]);

    const { tenant } = await requireTenantFromRequest(request);
    const config = await getCheckoutPaymentConfig(String(tenant.id));

    return json(response, 200, { config, requestId });
  });
}
