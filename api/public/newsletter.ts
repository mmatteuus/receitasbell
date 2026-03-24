import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withApiHandler, json, assertMethod } from '../../src/server/shared/http.js';
import { requireTenantFromRequest } from '../../src/server/tenancy/resolver.js';
import { subscribeToNewsletter } from '../../src/server/identity/newsletter.repo.js';
import { newsletterSchema } from '../../src/server/shared/validators.js';
import { requireCsrf } from '../../src/server/security/csrf.js';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return withApiHandler(request, response, async ({ requestId }) => {
    assertMethod(request, ['POST']);
    requireCsrf(request);

    const { tenant } = await requireTenantFromRequest(request);
    const body = newsletterSchema.parse(request.body);
    const result = await subscribeToNewsletter(tenant.id, body.email);
    return json(response, 201, { subscriber: result, requestId });
  });
}

