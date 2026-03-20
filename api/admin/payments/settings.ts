import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getTenantAdminPaymentSettings } from "../../../src/server/admin/payments.js";
import { requireTenantAdminAccess } from "../../../src/server/admin/tenantAccess.js";
import { assertMethod, sendJson, withApiHandler } from "../../../src/server/http.js";

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return withApiHandler(request, response, async () => {
    assertMethod(request, ["GET"]);
    const access = await requireTenantAdminAccess(request);
    const settings = await getTenantAdminPaymentSettings(request, access.tenant.id);
    return sendJson(response, 200, { settings });
  });
}
