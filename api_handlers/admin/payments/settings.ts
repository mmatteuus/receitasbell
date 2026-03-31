import type { VercelRequest, VercelResponse } from "@vercel/node";
import { withApiHandler, json, assertMethod } from "../../../src/server/shared/http.js";
import { requireAdminAccess } from "../../../src/server/admin/guards.js";
import { requireTenantFromRequest } from "../../../src/server/tenancy/resolver.js";
import { getTenantAdminPaymentSettings } from "../../../src/server/admin/payments.js";

export default withApiHandler(async (request: VercelRequest, response: VercelResponse, { requestId }) => {
  assertMethod(request, ["GET"]);
  const { tenant } = await requireTenantFromRequest(request);
  await requireAdminAccess(request);

  const settings = await getTenantAdminPaymentSettings(request, String(tenant.id));
  return json(response, 200, { settings, requestId });
});
