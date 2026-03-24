import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withApiHandler, json, assertMethod, getAppBaseUrl } from '../../src/server/shared/http.js';
import { requireTenantFromRequest } from '../../src/server/tenancy/resolver.js';
import { createMagicLinkToken } from '../../src/server/auth/magicLink.js';
import { sendMagicLinkEmail } from '../../src/server/integrations/email/client.js';
import { requireCsrf } from '../../src/server/security/csrf.js';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return withApiHandler(request, response, async ({ requestId }) => {
    assertMethod(request, ['POST']);
    requireCsrf(request);

    const { tenant } = await requireTenantFromRequest(request);
    const { email } = request.body as { email: string };
    
    if (!email) throw new Error("Email is required");
    
    const token = await createMagicLinkToken(tenant.id, email);
    const baseUrl = getAppBaseUrl(request);
    
    const magicLinkUrl = `${baseUrl}/api/auth/verify-magic-link?token=${token}&tenantId=${tenant.id}`;
    
    await sendMagicLinkEmail(email, magicLinkUrl);
    return json(response, 200, { sent: true, requestId });
  });
}
