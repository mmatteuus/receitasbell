import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireIdentityUser } from "../src/server/identity.js";
import { assertMethod, readJsonBody, sendJson, withApiHandler } from "../src/server/http.js";
import { createFavorite, listFavoritesByUserId } from "../src/server/sheets/favoritesRepo.js";

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return withApiHandler(request, response, async () => {
    const identity = await requireIdentityUser(request);

    if (request.method === "GET") {
      const favorites = await listFavoritesByUserId(identity.user!.id);
      return sendJson(response, 200, { favorites });
    }

    assertMethod(request, ["POST"]);
    const body = await readJsonBody<{ recipeId?: string }>(request);
    const favorite = await createFavorite(identity.user!.id, String(body.recipeId || ""));
    return sendJson(response, 201, { favorite });
  });
}
