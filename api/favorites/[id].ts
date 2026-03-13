import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireIdentityUser } from "../../src/server/identity.js";
import { ApiError, assertMethod, sendNoContent, withApiHandler } from "../../src/server/http.js";
import { deleteFavorite } from "../../src/server/sheets/favoritesRepo.js";

function getFavoriteId(request: VercelRequest) {
  const raw = request.query.id;
  return Array.isArray(raw) ? raw[0] : raw;
}

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return withApiHandler(request, response, async () => {
    assertMethod(request, ["DELETE"]);
    const favoriteId = getFavoriteId(request);
    if (!favoriteId) {
      throw new ApiError(400, "Favorite id is required");
    }

    const identity = await requireIdentityUser(request);
    await deleteFavorite(identity.user!.id, favoriteId);
    return sendNoContent(response);
  });
}
