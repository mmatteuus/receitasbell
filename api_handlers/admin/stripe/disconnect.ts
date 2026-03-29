import type { VercelRequest, VercelResponse } from "@vercel/node";
import { withApiHandler, json, assertMethod } from "../../../src/server/shared/http.js";
import { requireAdminAccess } from "../../../src/server/admin/guards.js";
import { requireTenantFromRequest } from "../../../src/server/tenancy/resolver.js";
import { disconnectTenantStripeConnection } from "../../../src/server/integrations/stripe/connections.js";
import { requireCsrf } from "../../../src/server/security/csrf.js";

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return withApiHandler(request, response, async ({ requestId }) => {
    assertMethod(request, ["POST"]);
    const { tenant } = await requireTenantFromRequest(request);
    const access = await requireAdminAccess(request);
    if (access.type === "session") requireCsrf(request);
    const actorId = access.type === "session" ? access.userId : "admin-api";
    await disconnectTenantStripeConnection({ tenantId: tenant.id, actorUserId: actorId });
    return json(response, 200, { success: true, requestId });
  });
}
