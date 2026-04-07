import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withApiHandler, json, assertMethod } from '../../src/server/shared/http.js';
import { requireTenantFromRequest } from '../../src/server/tenancy/resolver.js';
import { requireIdentityUser } from '../../src/server/auth/guards.js';
import { listEntitlementsByUserId } from '../../src/server/identity/entitlements.repo.js';

export default withApiHandler(
  async (request: VercelRequest, response: VercelResponse, { requestId }) => {
    assertMethod(request, ['GET']);
    const { tenant } = await requireTenantFromRequest(request);
    const identityUser = await requireIdentityUser(request);
    const userId = identityUser.user?.id || identityUser.email;

    const entitlements = await listEntitlementsByUserId(tenant.id, userId);
    return json(response, 200, { entitlements, requestId });
  }
);
