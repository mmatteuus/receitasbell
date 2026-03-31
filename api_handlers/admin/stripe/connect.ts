import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withApiHandler, json, assertMethod } from '../../../src/server/shared/http.js';
import { requireAdminAccess } from '../../../src/server/admin/guards.js';
import { requireTenantFromRequest } from '../../../src/server/tenancy/resolver.js';
import { getStripeConnectUrl } from '../../../src/server/integrations/stripe/oauth.js';
import { requireCsrf } from '../../../src/server/security/csrf.js';

export default withApiHandler(
  async (request: VercelRequest, response: VercelResponse, { requestId }) => {
    assertMethod(request, ['POST']);
    const { tenant } = await requireTenantFromRequest(request);
    const access = await requireAdminAccess(request);
    if (access.type === 'session') requireCsrf(request);
    const body = (
      typeof request.body === 'string' ? JSON.parse(request.body || '{}') : (request.body ?? {})
    ) as { returnTo?: string | null };
    const tenantUserId = access.type === 'session' ? access.userId : 'admin-api';
    const result = await getStripeConnectUrl(tenant.id, {
      tenantUserId,
      returnTo: body.returnTo || '/admin/pagamentos/configuracoes',
    });
    return json(response, 200, { authorizationUrl: result.authorizationUrl, requestId });
  }
);
