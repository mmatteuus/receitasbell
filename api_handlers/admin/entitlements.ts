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

export default withApiHandler(async (request: VercelRequest, response: VercelResponse, { requestId }) => {
  const { tenant } = await requireTenantFromRequest(request);
  const access = await requireAdminAccess(request);
  const actorType = access.type === "session" ? "admin" : "system";
  const actorId = access.type === "session" ? access.userId : "admin-api";

  if (request.method === "POST") {
    if (access.type === "session") {
      requireCsrf(request);
    }

    const payload = request.body as {
      userId?: string;
      recipeId?: string;
      paymentOrderId?: string;
    };

    if (!payload.userId?.trim() || !payload.recipeId?.trim()) {
      throw new ApiError(400, "userId e recipeId são obrigatórios");
    }

    const entitlement = await createEntitlement(tenant.id, {
      userId: payload.userId,
      recipeId: payload.recipeId,
      paymentOrderId: payload.paymentOrderId?.trim() || null,
    });

    await logAuditEvent({
      tenantId: tenant.id,
      actorType,
      actorId,
      action: "create_entitlement",
      resourceType: "entitlement",
      resourceId: String(entitlement.id),
      payload: { userId: payload.userId, recipeId: payload.recipeId, paymentOrderId: payload.paymentOrderId }
    });

    return json(response, 201, { entitlement, requestId });
  }

  if (request.method === "DELETE") {
    if (access.type === "session") {
      requireCsrf(request);
    }

    const payload = request.body as {
      userId?: string;
      recipeId?: string;
    };

    if (!payload.userId?.trim() || !payload.recipeId?.trim()) {
      throw new ApiError(400, "userId e recipeId são obrigatórios");
    }

    await revokeEntitlement(
      tenant.id,
      payload.userId,
      payload.recipeId,
    );

    await logAuditEvent({
      tenantId: tenant.id,
      actorType,
      actorId,
      action: "revoke_entitlement",
      resourceType: "entitlement",
      resourceId: `${payload.userId}:${payload.recipeId}`,
      payload: { userId: payload.userId, recipeId: payload.recipeId }
    });

    return json(response, 200, { success: true, requestId });
  }

  assertMethod(request, ["POST", "DELETE"]);
});
