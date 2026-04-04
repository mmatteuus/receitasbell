import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withApiHandler, json, assertMethod, setPublicCache, ApiError } from '../../../src/server/shared/http.js';
import { requireTenantFromRequest } from '../../../src/server/tenancy/resolver.js';
import { getRecipeBySlug } from '../../../src/server/recipes/repo.js';
import { getUserSession } from '../../../src/server/auth/sessions.js';

export default withApiHandler(async (request: VercelRequest, response: VercelResponse, { requestId }: { requestId: string }) => {
  assertMethod(request, ['GET']);
  const { tenant } = await requireTenantFromRequest(request);
  const session = await getUserSession(request);
  const userId = session?.userId;

  const slugFromPath = request.query?.slug;
  const slug = typeof slugFromPath === "string"
    ? slugFromPath
    : Array.isArray(slugFromPath) && slugFromPath.length > 0
      ? slugFromPath[0]
      : new URL(request.url || '', 'http://localhost').searchParams.get('slug');

  if (!slug) {
    throw new ApiError(400, 'Missing recipe slug');
  }

  const recipe = await getRecipeBySlug(tenant.id, slug, userId);

  if (!recipe) {
    throw new ApiError(404, 'Recipe not found');
  }

  // Apenas cacheamos publicamente se for gratuita. 
  // Receitas pagas dependem do usuário logado, então o cache deve ser privado ou inexistente.
  if (recipe.accessTier === "free") {
    setPublicCache(response, 600); // 10 minutes
  } else {
    response.setHeader('Cache-Control', 'no-store, max-age=0');
  }

  // Se o usuário não tem acesso, limpamos os dados sensíveis
  if (!recipe.hasAccess) {
    recipe.fullIngredients = [];
    recipe.fullInstructions = [];
    recipe.videoUrl = null;
  }

  return json(response, 200, {
    recipe,
    item: recipe,
    requestId
  });
});

