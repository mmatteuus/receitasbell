import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withApiHandler, sendJson, readJsonBody, assertMethod } from '../../src/server/http.js';
import { requireTenantFromRequest } from '../../src/server/tenants/resolver.js';
import { subscribeToNewsletter } from '../../src/server/baserow/newsletterRepo.js';
import { newsletterSchema } from '../../src/server/validators.js';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return withApiHandler(request, response, async () => {
    assertMethod(request, ['POST']);
    const { tenant } = await requireTenantFromRequest(request);
    const body = newsletterSchema.parse(await readJsonBody(request));
    const result = await subscribeToNewsletter(tenant.id, body.email);
    return sendJson(response, 201, { subscriber: result });
  });
}
