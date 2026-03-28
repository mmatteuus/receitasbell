import type { VercelRequest, VercelResponse } from "@vercel/node";
import crypto from "node:crypto";
import {
  ApiError,
  assertMethod,
  getAppBaseUrl,
  getClientAddress,
  json,
  readJsonBody,
  withApiHandler,
} from "../../src/server/shared/http.js";
import { createAuditLog } from "../../src/server/audit/service.js";
import { createPixPayment } from "../../src/server/payments/direct.js";
import { requireSameOriginIfPresent } from "../../src/server/security/csrf.js";
import { rateLimit } from "../../src/server/shared/rateLimit.js";
import { pixPaymentCreateSchema } from "../../src/server/shared/validators.js";
import { requireTenantFromRequest } from "../../src/server/tenancy/resolver.js";

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return withApiHandler(request, response, async ({ requestId }) => {
    assertMethod(request, ["POST"]);
    requireSameOriginIfPresent(request);

    const limiter = await rateLimit(`payments:pix:${getClientAddress(request)}`, {
      limit: 20,
      window: "1 m",
      endpoint: "payments.pix",
    });
    if (!limiter.success) {
      throw new ApiError(429, "Too many PIX payment requests. Please try again shortly.");
    }

    const { tenant } = await requireTenantFromRequest(request);
    const rawBody = await readJsonBody<Record<string, unknown>>(request);
    const body = pixPaymentCreateSchema.parse(rawBody);
    const checkoutReference = body.checkoutReference || crypto.randomUUID();
    const result = await createPixPayment(String(tenant.id), {
      recipeIds: body.recipeIds,
      buyerEmail: body.buyerEmail.toLowerCase(),
      payerName: body.payerName,
      checkoutReference,
      identification: body.identification,
      baseUrl: getAppBaseUrl(request),
    });

    await createAuditLog(request, {
      tenantId: String(tenant.id),
      actorType: "user",
      actorId: body.buyerEmail.toLowerCase(),
      action: "payment.pix.create",
      resourceType: "payment_order",
      resourceId: String(result.paymentOrderId),
      payload: {
        paymentId: result.paymentId,
        status: result.status,
        checkoutReference,
        recipeIds: body.recipeIds,
      },
    });

    return json(response, 201, { ...result, requestId });
  });
}
