import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getPaymentById } from "../../../src/server/sheets/paymentsRepo.js";
import { listEntitlementsByEmail } from "../../../src/server/sheets/entitlementsRepo.js";
import { getRecipeById } from "../../../src/server/sheets/recipesRepo.js";
import { ApiError, assertMethod, requireAdminAccess, sendJson, withApiHandler } from "../../../src/server/http.js";

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return withApiHandler(request, response, async () => {
    assertMethod(request, ["GET"]);
    requireAdminAccess(request);
    const paymentId = String(request.query.id || "");
    const details = await getPaymentById(paymentId);

    if (!details) {
      throw new ApiError(404, "Payment not found");
    }

    const recipes = (
      await Promise.all(
        details.payment.recipeIds.map((recipeId) =>
          getRecipeById(recipeId, {
            includeDrafts: true,
          }),
        ),
      )
    ).filter((recipe) => Boolean(recipe));
    const entitlements = (await listEntitlementsByEmail(details.payment.payerEmail)).filter(
      (entitlement) =>
        entitlement.paymentId === details.payment.id ||
        details.payment.items.some((item) => item.slug === entitlement.recipeSlug),
    );

    return sendJson(response, 200, {
      payment: details.payment,
      recipes,
      entitlements,
      events: details.events,
      notes: details.notes,
    });
  });
}
