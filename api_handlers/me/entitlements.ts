import type { VercelRequest, VercelResponse } from "@vercel/node";
import { withApiHandler, json, assertMethod } from "../../src/server/shared/http.js";
import { requireTenantFromRequest } from "../../src/server/tenancy/resolver.js";
import { requireIdentityUser } from "../../src/server/auth/guards.js";
import { listEntitlementsByEmail } from "../../src/server/identity/entitlements.repo.js";

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return withApiHandler(request, response, async ({ requestId }) => {
    assertMethod(request, ["GET"]);
    const { tenant } = await requireTenantFromRequest(request);
    const { email } = await requireIdentityUser(request);
    
    const entitlements = await listEntitlementsByEmail(tenant.id, email);
    return json(response, 200, { entitlements, requestId });
  });
}
