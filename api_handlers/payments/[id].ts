import type { VercelRequest, VercelResponse } from "@vercel/node";
import { ApiError, assertMethod, getQueryValue, json, withApiHandler } from "../../src/server/shared/http.js";
import { createAuditLog } from "../../src/server/audit/service.js";
import { getDirectPaymentStatus } from "../../src/server/payments/direct.js";
import { requireTenantFromRequest } from "../../src/server/tenancy/resolver.js";

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return withApiHandler(request, response, async ({ requestId }) => {
    assertMethod(request, ["GET"]);

    const paymentId = getQueryValue(request, "id");
    if (!paymentId) {
      throw new ApiError(400, "Payment id is required.");
    }

    const { tenant } = await requireTenantFromRequest(request);
    const result = await getDirectPaymentStatus(String(tenant.id), paymentId);

    await createAuditLog(request, {
      tenantId: String(tenant.id),
      actorType: "system",
      actorId: "system",
      action: "payment.status.read",
      resourceType: "payment_order",
      resourceId: String(result.paymentOrderId),
      payload: {
        paymentId: result.paymentId,
        status: result.status,
      },
    });

    return json(response, 200, { ...result, requestId });
  });
}
