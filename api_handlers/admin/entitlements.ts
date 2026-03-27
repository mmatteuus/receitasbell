import type { VercelRequest, VercelResponse } from "@vercel/node";
import { withApiHandler, json, assertMethod, ApiError } from "../../src/server/shared/http.js";
import { requireTenantFromRequest } from "../../src/server/tenancy/resolver.js";
import { requireAdminAccess } from "../../src/server/admin/guards.js";
import { logAuditEvent } from "../../src/server/audit/repo.js";
import { requireCsrf } from "../../src/server/security/csrf.js";
import { 
  createEntitlement, 
  revokeEntitlement 
} from "../../src/server/identity/entitlements.repo.js";

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return withApiHandler(request, response, async ({ requestId }) => {
    const { tenant } = await requireTenantFromRequest(request);
    const access = await requireAdminAccess(request);
    const actorType = access.type === "session" ? "admin" : "system";
    const actorId = access.type === "session" ? access.userId : "admin-api";

    if (request.method === "POST") {
      if (access.type === "session") {
        requireCsrf(request);
      }

      const payload = request.body as {
        paymentId?: string;
        payerEmail?: string;
        recipeSlug?: string;
      };

      if (!payload.paymentId?.trim() || !payload.payerEmail?.trim() || !payload.recipeSlug?.trim()) {
        throw new ApiError(400, "paymentId, payerEmail e recipeSlug são obrigatórios");
      }

      const entitlement = await createEntitlement(tenant.id, {
        paymentId: payload.paymentId,
        payerEmail: payload.payerEmail,
        recipeSlug: payload.recipeSlug,
      });

      await logAuditEvent({
        tenantId: tenant.id,
        actorType,
        actorId,
        action: "create_entitlement",
        resourceType: "entitlement",
        resourceId: String(entitlement.id),
        payload: { paymentId: payload.paymentId, email: payload.payerEmail, slug: payload.recipeSlug }
      });

      return json(response, 201, { entitlement, requestId });
    }

    if (request.method === "DELETE") {
      if (access.type === "session") {
        requireCsrf(request);
      }

      const payload = request.body as {
        paymentId?: string;
        recipeSlug?: string;
      };

      if (!payload.paymentId?.trim()) {
        throw new ApiError(400, "paymentId é obrigatório");
      }

      await revokeEntitlement(
        tenant.id,
        payload.paymentId,
        payload.recipeSlug?.trim() || undefined,
      );

      await logAuditEvent({
        tenantId: tenant.id,
        actorType,
        actorId,
        action: "revoke_entitlement",
        resourceType: "entitlement",
        resourceId: String(payload.paymentId),
        payload: { paymentId: payload.paymentId, slug: payload.recipeSlug }
      });

      return json(response, 200, { success: true, requestId });
    }

    assertMethod(request, ["POST", "DELETE"]);
  });
}
