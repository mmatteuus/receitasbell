import type { VercelRequest, VercelResponse } from "@vercel/node";
import { findOrCreateUserByEmail } from "../src/server/sheets/usersRepo.js";
import { assertMethod, readJsonBody, sendJson, withApiHandler } from "../src/server/http.js";
import { createMockCheckout } from "../src/server/sheets/paymentsRepo.js";
import { checkoutSchema } from "../src/server/validators.js";

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return withApiHandler(request, response, async () => {
    assertMethod(request, ["POST"]);
    const body = checkoutSchema.parse(await readJsonBody(request));
    const buyerEmail = body.buyerEmail?.trim().toLowerCase() || "";
    const user = await findOrCreateUserByEmail(buyerEmail);
    const result = await createMockCheckout({
      recipeIds: body.recipeIds,
      buyerEmail,
      userId: user.id,
      checkoutReference: body.checkoutReference,
    });

    return sendJson(response, 201, result);
  });
}
