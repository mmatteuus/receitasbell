import type { VercelRequest, VercelResponse } from "@vercel/node";
import { resolveOptionalIdentityUser } from "../../src/server/identity.js";
import { ApiError, assertMethod, hasAdminAccess, readJsonBody, requireAdminAccess, sendJson, sendNoContent, withApiHandler } from "../../src/server/http.js";
import { deleteRecipe, getRecipeById, getRecipeBySlug, updateRecipe } from "../../src/server/sheets/recipesRepo.js";
import { recipeMutationSchema } from "../../src/server/validators.js";

function getIdentifier(request: VercelRequest) {
  const raw = request.query.identifier;
  return Array.isArray(raw) ? raw[0] : raw;
}

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return withApiHandler(request, response, async () => {
    const identifier = getIdentifier(request);
    if (!identifier) {
      throw new ApiError(400, "Recipe identifier is required");
    }

    if (request.method === "GET") {
      const identity = await resolveOptionalIdentityUser(request);
      const lookupBy = Array.isArray(request.query.by) ? request.query.by[0] : request.query.by;
      const recipe = lookupBy === "id"
        ? await getRecipeById(identifier, {
          includeDrafts: hasAdminAccess(request),
          identity: {
            userId: identity.user?.id,
            email: identity.email,
          },
        })
        : await getRecipeBySlug(identifier, {
          includeDrafts: hasAdminAccess(request),
          identity: {
            userId: identity.user?.id,
            email: identity.email,
          },
        });

      if (!recipe) {
        throw new ApiError(404, "Recipe not found");
      }

      return sendJson(response, 200, { recipe });
    }

    if (request.method === "PUT") {
      requireAdminAccess(request);
      const body = recipeMutationSchema.parse(await readJsonBody(request));
      const recipe = await updateRecipe(identifier, body);
      return sendJson(response, 200, { recipe });
    }

    assertMethod(request, ["DELETE"]);
    requireAdminAccess(request);
    await deleteRecipe(identifier);
    return sendNoContent(response);
  });
}
