import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withApiHandler, sendJson, readJsonBody, assertMethod, getAppBaseUrl } from '../../src/server/shared/http.js';
import { requireTenantFromRequest } from '../../src/server/domains/tenants/resolver.js';
import { createMagicLinkToken } from '../../src/server/domains/auth/magicLink.js';
import { sendMagicLinkEmail } from '../../src/server/integrations/email.js';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return withApiHandler(request, response, async () => {
    assertMethod(request, ['POST']);
    const { tenant } = await requireTenantFromRequest(request);
    const { email } = await readJsonBody<{ email: string }>(request);
    if (!email) throw new Error("Email is required");
    
    const token = await createMagicLinkToken(tenant.id, email);
    const baseUrl = getAppBaseUrl(request);
    const magicLinkUrl = `${baseUrl}/api/auth/verify?token=${token}&tenantId=${tenant.id}`;
    
    await sendMagicLinkEmail(email, magicLinkUrl);
    return sendJson(response, 200, { sent: true });
  });
}
