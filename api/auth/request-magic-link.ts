import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withApiHandler, json, assertMethod, getAppBaseUrl, getClientAddress, ApiError } from '../../src/server/shared/http.js';
import { requireTenantFromRequest } from '../../src/server/tenancy/resolver.js';
import { createMagicLink } from '../../src/server/auth/magicLinks.js';
import { sendMagicLinkEmail } from '../../src/server/integrations/email/client.js';
import { requireCsrf } from '../../src/server/security/csrf.js';
import { AuthRateLimit } from '../../src/server/shared/rateLimit.js';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return withApiHandler(request, response, async ({ requestId }) => {
    assertMethod(request, ['POST']);
    requireCsrf(request);

    const { tenant } = await requireTenantFromRequest(request);
    const ip = getClientAddress(request);
    const { email, redirectTo } = request.body as { email: string; redirectTo?: string };
    
    if (!email) throw new Error("Email is required");

    // Rate Limit by IP + Email
    const rlKey = `${ip}:${email.toLowerCase()}`;
    const rl = await AuthRateLimit.check(rlKey);
    if (!rl.success) {
        response.setHeader('Retry-After', String(rl.resetAfter));
        throw new ApiError(429, `Muitos pedidos. Tente novamente em ${rl.resetAfter}s.`);
    }
    
    const { token } = await createMagicLink({
      tenantId: String(tenant.id),
      email,
      purpose: 'user_login',
      redirectTo: redirectTo || null
    });

    const baseUrl = getAppBaseUrl(request);
    const magicLinkUrl = `${baseUrl}/api/auth/verify-magic-link?token=${token}&tenantId=${tenant.id}`;
    
    await sendMagicLinkEmail(email, magicLinkUrl);
    return json(response, 200, { sent: true, requestId });
  });
}
