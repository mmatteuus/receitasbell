import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withApiHandler, sendJson, readJsonBody, resolveOptionalIdentityUser, assertMethod } from '../../src/server/shared/http.js';
import { requireTenantFromRequest } from '../../src/server/domains/tenants/resolver.js';
import { upsertRating } from '../../src/server/domains/recipes/ratings.repo.js';
import { ratingSchema } from '../../src/server/shared/validators.js';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return withApiHandler(request, response, async () => {
    assertMethod(request, ['POST']);
    const { tenant } = await requireTenantFromRequest(request);
    const body = ratingSchema.parse(await readJsonBody(request));
    const identity = await resolveOptionalIdentityUser(request);
    
    const summary = await upsertRating(tenant.id, {
      recipeId: body.recipeId,
      value: body.value,
      userId: identity.user?.id ? String(identity.user.id) : undefined,
      authorEmail: identity.email || '',
    });
    
    return sendJson(response, 200, summary);
  });
}
