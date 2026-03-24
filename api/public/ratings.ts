import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withApiHandler, json, assertMethod } from '../../src/server/shared/http.js';
import { requireTenantFromRequest } from '../../src/server/tenancy/resolver.js';
import { resolveOptionalIdentityUser } from '../../src/server/auth/guards.js';
import { upsertRating } from '../../src/server/recipes/ratings.repo.js';
import { ratingSchema } from '../../src/server/shared/validators.js';
import { requireCsrf } from '../../src/server/security/csrf.js';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return withApiHandler(request, response, async ({ requestId }) => {
    assertMethod(request, ['POST']);
    requireCsrf(request);

    const { tenant } = await requireTenantFromRequest(request);
    const body = ratingSchema.parse(request.body);
    const identity = await resolveOptionalIdentityUser(request);
    
    const summary = await upsertRating(tenant.id, {
      recipeId: body.recipeId,
      value: body.value,
      userId: identity.user?.id ? String(identity.user.id) : undefined,
      authorEmail: identity.email || '',
    });
    
    return json(response, 200, { ...summary, requestId });
  });
}

