import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireIdentityUser } from "../src/server/identity.js";
import { assertMethod, readJsonBody, sendJson, withApiHandler } from "../src/server/http.js";
import { upsertRating } from "../src/server/sheets/ratingsRepo.js";
import { ratingSchema } from "../src/server/validators.js";

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return withApiHandler(request, response, async () => {
    assertMethod(request, ["POST"]);
    const body = ratingSchema.parse(await readJsonBody(request));
    const identity = await requireIdentityUser(request);
    const summary = await upsertRating({
      recipeId: body.recipeId,
      value: body.value,
      userId: identity.user?.id,
      authorEmail: identity.email,
    });

    return sendJson(response, 200, summary);
  });
}
