import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  createEntitlement,
  listEntitlementsByEmail,
  revokeEntitlement,
} from "../src/server/sheets/entitlementsRepo.js";
import {
  ApiError,
  assertMethod,
  readJsonBody,
  requireAdminAccess,
  requireIdentityEmail,
  sendJson,
  withApiHandler,
} from "../src/server/http.js";

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return withApiHandler(request, response, async () => {
    if (request.method === "GET") {
      const email = requireIdentityEmail(request);
      const entitlements = await listEntitlementsByEmail(email);
      return sendJson(response, 200, { entitlements });
    }

    if (request.method === "POST") {
      requireAdminAccess(request);
      const payload = await readJsonBody<{
        paymentId?: string;
        payerEmail?: string;
        recipeSlug?: string;
      }>(request);

      if (!payload.paymentId?.trim() || !payload.payerEmail?.trim() || !payload.recipeSlug?.trim()) {
        throw new ApiError(400, "paymentId, payerEmail e recipeSlug são obrigatórios");
      }

      const entitlement = await createEntitlement({
        paymentId: payload.paymentId,
        payerEmail: payload.payerEmail,
        recipeSlug: payload.recipeSlug,
      });

      return sendJson(response, 201, { entitlement });
    }

    if (request.method === "DELETE") {
      requireAdminAccess(request);
      const payload = await readJsonBody<{
        paymentId?: string;
        recipeSlug?: string;
      }>(request);

      if (!payload.paymentId?.trim()) {
        throw new ApiError(400, "paymentId é obrigatório");
      }

      const entitlements = await revokeEntitlement(
        payload.paymentId,
        payload.recipeSlug?.trim() || undefined,
      );

      return sendJson(response, 200, { entitlements });
    }

    assertMethod(request, ["GET", "POST", "DELETE"]);
  });
}
