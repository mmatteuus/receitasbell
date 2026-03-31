import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withApiHandler, json, assertMethod, ApiError, getClientAddress } from '../../src/server/shared/http.js';
import { requireTenantFromRequest } from '../../src/server/tenancy/resolver.js';
import { subscribeToNewsletter } from '../../src/server/identity/newsletter.repo.js';
import { newsletterSchema } from '../../src/server/shared/validators.js';
import { requireSameOriginIfPresent } from '../../src/server/security/csrf.js';
import { rateLimit } from '../../src/server/shared/rateLimit.js';

export default withApiHandler(async (request: VercelRequest, response: VercelResponse, { requestId }: { requestId: string }) => {
  assertMethod(request, ['POST']);
  requireSameOriginIfPresent(request);
  const limiter = await rateLimit(`newsletter:${getClientAddress(request)}`, {
    limit: 10,
    window: "10 m",
    endpoint: "public.newsletter",
  });
  if (!limiter.success) {
    throw new ApiError(429, "Too many newsletter submissions. Please try again later.");
  }

  const { tenant } = await requireTenantFromRequest(request);
  const body = newsletterSchema.parse(request.body);
  const result = await subscribeToNewsletter(tenant.id, body.email);
  return json(response, 201, { subscriber: result, requestId });
});
