import type { VercelRequest, VercelResponse } from "@vercel/node";
import { ApiError, assertMethod, requireAdminAccess, sendJson, withApiHandler } from "../../src/server/http.js";
import { getPaymentById } from "../../src/server/sheets/paymentsRepo.js";

function getPaymentId(request: VercelRequest) {
  const raw = request.query.id;
  return Array.isArray(raw) ? raw[0] : raw;
}

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return withApiHandler(request, response, async () => {
    assertMethod(request, ["GET"]);
    requireAdminAccess(request);

    const paymentId = getPaymentId(request);
    if (!paymentId) {
      throw new ApiError(400, "Payment id is required");
    }

    const details = await getPaymentById(paymentId);
    if (!details) {
      throw new ApiError(404, "Payment not found");
    }

    return sendJson(response, 200, details);
  });
}
