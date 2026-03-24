import type { VercelRequest, VercelResponse } from "@vercel/node";
import { withApiHandler, json, assertMethod, readJsonBody, ApiError } from "../../src/server/shared/http.js";
import { requireTenantFromRequest } from "../../src/server/tenancy/resolver.js";
import { requireAdminAccess } from "../../src/server/auth/guards.js";
import { 
  createEntitlement, 
  revokeEntitlement 
} from "../../src/server/identity/entitlements.repo.js";

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return withApiHandler(request, response, async ({ requestId }) => {
    const { tenant } = await requireTenantFromRequest(request);
    await requireAdminAccess(request);

    if (request.method === "POST") {
      const payload = await readJsonBody<{
        paymentId?: string;
        payerEmail?: string;
        recipeSlug?: string;
      }>(request);

      if (!payload.paymentId?.trim() || !payload.payerEmail?.trim() || !payload.recipeSlug?.trim()) {
        throw new ApiError(400, "paymentId, payerEmail e recipeSlug são obrigatórios");
      }

      const entitlement = await createEntitlement(tenant.id, {
        paymentId: payload.paymentId,
        payerEmail: payload.payerEmail,
        recipeSlug: payload.recipeSlug,
      });

      return json(response, 201, { entitlement, requestId });
    }

    if (request.method === "DELETE") {
      const payload = await readJsonBody<{
        paymentId?: string;
        recipeSlug?: string;
      }>(request);

      if (!payload.paymentId?.trim()) {
        throw new ApiError(400, "paymentId é obrigatório");
      }

      await revokeEntitlement(
        tenant.id,
        payload.paymentId,
        payload.recipeSlug?.trim() || undefined,
      );

      return json(response, 200, { success: true, requestId });
    }

    assertMethod(request, ["POST", "DELETE"]);
  });
}
