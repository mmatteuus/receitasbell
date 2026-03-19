import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getPaymentById } from "../../src/server/sheets/paymentsRepo.js";
import { ApiError, assertMethod, getIdentityEmail, hasAdminAccess, sendJson, withApiHandler } from "../../src/server/http.js";

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return withApiHandler(request, response, async () => {
    assertMethod(request, ["GET"]);
    const paymentId = String(request.query.id || "");
    const details = await getPaymentById(paymentId);

    if (!details) {
      throw new ApiError(404, "Payment not found");
    }

    const identityEmail = getIdentityEmail(request);
    if (!hasAdminAccess(request) && identityEmail !== details.payment.payerEmail) {
      throw new ApiError(404, "Payment not found");
    }

    return sendJson(response, 200, {
      ...details.payment,
      payment: details.payment,
      events: details.events,
      notes: details.notes,
    });
  });
}
