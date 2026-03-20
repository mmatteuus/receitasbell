import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getRecipeById } from "../../../../src/server/sheets/recipesRepo.js";
import { getTenantPaymentById } from "../../../../src/server/mercadopago/payments.js";
import { requireTenantAdminAccess } from "../../../../src/server/admin/tenantAccess.js";
import { ApiError, assertMethod, sendJson, withApiHandler } from "../../../../src/server/http.js";

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return withApiHandler(request, response, async () => {
    assertMethod(request, ["GET"]);
    const access = await requireTenantAdminAccess(request);
    const paymentId = String(request.query.id || "");
    const details = await getTenantPaymentById(access.tenant.id, paymentId);

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
    ).filter(Boolean);

    return sendJson(response, 200, {
      ...details,
      recipes,
    });
  });
}
