import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  ApiError,
  assertMethod,
  getClientAddress,
  getQueryValue,
  json,
  withApiHandler,
} from "../../../src/server/shared/http.js";
import { createAuditLog } from "../../../src/server/audit/service.js";
import { cancelDirectPayment } from "../../../src/server/payments/direct.js";
import { requireSameOriginIfPresent } from "../../../src/server/security/csrf.js";
import { rateLimit } from "../../../src/server/shared/rateLimit.js";
import { requireTenantFromRequest } from "../../../src/server/tenancy/resolver.js";

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return withApiHandler(request, response, async ({ requestId }) => {
    assertMethod(request, ["POST"]);
    requireSameOriginIfPresent(request);

    const paymentId = getQueryValue(request, "id");
    if (!paymentId) {
      throw new ApiError(400, "Payment id is required.");
    }

    const limiter = await rateLimit(`payments:cancel:${getClientAddress(request)}`, {
      limit: 10,
      window: "1 m",
      endpoint: "payments.cancel",
    });
    if (!limiter.success) {
      throw new ApiError(429, "Too many cancel requests. Please try again shortly.");
    }

    const { tenant } = await requireTenantFromRequest(request);
    const result = await cancelDirectPayment(String(tenant.id), paymentId);

    await createAuditLog(request, {
      tenantId: String(tenant.id),
      actorType: "system",
      actorId: "system",
      action: "payment.cancel",
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
