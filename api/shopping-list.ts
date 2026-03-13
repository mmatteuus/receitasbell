import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireIdentityUser } from "../src/server/identity.js";
import { assertMethod, readJsonBody, sendJson, withApiHandler } from "../src/server/http.js";
import { createShoppingListItems, listShoppingListItems } from "../src/server/sheets/shoppingListRepo.js";
import { shoppingListCreateSchema } from "../src/server/validators.js";

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return withApiHandler(request, response, async () => {
    const identity = await requireIdentityUser(request);

    if (request.method === "GET") {
      const items = await listShoppingListItems(identity.user!.id);
      return sendJson(response, 200, { items });
    }

    assertMethod(request, ["POST"]);
    const body = shoppingListCreateSchema.parse(await readJsonBody(request));
    const items = await createShoppingListItems(identity.user!.id, body.items);
    return sendJson(response, 201, { items });
  });
}
