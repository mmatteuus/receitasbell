import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withApiHandler, json, assertMethod, ApiError } from '../../src/server/shared/http.js';
import { requireTenantFromRequest } from '../../src/server/tenancy/resolver.js';
import { resolveOptionalIdentityUser } from '../../src/server/auth/guards.js';
import { upsertRating } from '../../src/server/recipes/ratings.repo.js';
import { ratingSchema } from '../../src/server/shared/validators.js';
import { requireSameOriginIfPresent } from '../../src/server/security/csrf.js';

export default withApiHandler(async (request: VercelRequest, response: VercelResponse, { requestId }: { requestId: string }) => {
  assertMethod(request, ['POST']);
  requireSameOriginIfPresent(request);

  const { tenant } = await requireTenantFromRequest(request);
  const body = ratingSchema.parse(request.body);
  const identity = await resolveOptionalIdentityUser(request);
  
  const userId = String(identity.user?.id || '');
  if (!userId) throw new ApiError(401, "Authentication required to rate recipes");

  const summary = await upsertRating(String(tenant.id), {
    recipeId: body.recipeId,
    value: body.value,
    userId,
  });
  
  return json(response, 200, { ...summary, requestId });
});
