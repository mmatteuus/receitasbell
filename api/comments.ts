import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireIdentityUser } from "../src/server/identity.js";
import { ApiError, assertMethod, readJsonBody, requireQueryParam, sendJson, withApiHandler } from "../src/server/http.js";
import { createComment, listCommentsByRecipeId } from "../src/server/sheets/commentsRepo.js";
import { commentSchema } from "../src/server/validators.js";

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return withApiHandler(request, response, async () => {
    if (request.method === "GET") {
      const recipeId = requireQueryParam(request, "recipeId");
      const comments = await listCommentsByRecipeId(recipeId);
      return sendJson(response, 200, { comments });
    }

    assertMethod(request, ["POST"]);
    const body = commentSchema.parse(await readJsonBody(request));
    const identity = await requireIdentityUser(request, body.authorName);
    if (!identity.user) {
      throw new ApiError(401, "Identity user not found");
    }

    const comment = await createComment({
      recipeId: body.recipeId,
      authorName: body.authorName,
      authorEmail: identity.email,
      userId: identity.user.id,
      text: body.text,
    });

    return sendJson(response, 201, { comment });
  });
}
