import type { VercelRequest, VercelResponse } from "@vercel/node";
import { resolveOptionalIdentityUser } from "../src/server/identity.js";
import { assertMethod, hasAdminAccess, parseStringArray, readJsonBody, requireAdminAccess, sendJson, withApiHandler } from "../src/server/http.js";
import { createRecipe, listRecipes } from "../src/server/sheets/recipesRepo.js";
import { recipeMutationSchema } from "../src/server/validators.js";

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return withApiHandler(request, response, async () => {
    if (request.method === "GET") {
      const identity = await resolveOptionalIdentityUser(request);
      const categorySlug = Array.isArray(request.query.categorySlug) ? request.query.categorySlug[0] : request.query.categorySlug;
      const q = Array.isArray(request.query.q) ? request.query.q[0] : request.query.q;
      const ids = parseStringArray(request.query.ids);

      const recipes = await listRecipes({
        categorySlug: categorySlug ? String(categorySlug) : undefined,
        q: q ? String(q) : undefined,
        ids,
        includeDrafts: hasAdminAccess(request),
        identity: {
          userId: identity.user?.id,
          email: identity.email,
        },
      });

      return sendJson(response, 200, { recipes });
    }

    assertMethod(request, ["POST"]);
    requireAdminAccess(request);

    const body = recipeMutationSchema.parse(await readJsonBody(request));
    const recipe = await createRecipe(body);
    return sendJson(response, 201, { recipe });
  });
}
