import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireIdentityUser } from "../../src/server/identity.js";
import { ApiError, assertMethod, readJsonBody, sendJson, sendNoContent, withApiHandler } from "../../src/server/http.js";
import { deleteShoppingListItem, updateShoppingListItem } from "../../src/server/sheets/shoppingListRepo.js";
import { shoppingListUpdateSchema } from "../../src/server/validators.js";

function getItemId(request: VercelRequest) {
  const raw = request.query.id;
  return Array.isArray(raw) ? raw[0] : raw;
}

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return withApiHandler(request, response, async () => {
    const itemId = getItemId(request);
    if (!itemId) {
      throw new ApiError(400, "Shopping list item id is required");
    }

    const identity = await requireIdentityUser(request);

    if (request.method === "PUT") {
      const body = shoppingListUpdateSchema.parse(await readJsonBody(request));
      const item = await updateShoppingListItem(identity.user!.id, itemId, body);
      return sendJson(response, 200, { item });
    }

    assertMethod(request, ["DELETE"]);
    await deleteShoppingListItem(identity.user!.id, itemId);
    return sendNoContent(response);
  });
}
