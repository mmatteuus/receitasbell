import type { VercelRequest, VercelResponse } from "@vercel/node";
import { assertMethod, parseStringArray, requireAdminAccess, sendJson, withApiHandler } from "../src/server/http.js";
import { listPayments } from "../src/server/sheets/paymentsRepo.js";

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return withApiHandler(request, response, async () => {
    assertMethod(request, ["GET"]);
    requireAdminAccess(request);

    const status = parseStringArray(request.query.status);
    const paymentMethod = parseStringArray(request.query.method || request.query.paymentMethod);
    const email = Array.isArray(request.query.email) ? request.query.email[0] : request.query.email;
    const paymentId = Array.isArray(request.query.paymentId) ? request.query.paymentId[0] : request.query.paymentId;
    const externalReference = Array.isArray(request.query.external_reference)
      ? request.query.external_reference[0]
      : request.query.external_reference;
    const dateFrom = Array.isArray(request.query.dateFrom) ? request.query.dateFrom[0] : request.query.dateFrom;
    const dateTo = Array.isArray(request.query.dateTo) ? request.query.dateTo[0] : request.query.dateTo;

    const payments = await listPayments({
      status: status as never,
      paymentMethod,
      email: email ? String(email) : undefined,
      paymentId: paymentId ? String(paymentId) : undefined,
      externalReference: externalReference ? String(externalReference) : undefined,
      dateFrom: dateFrom ? String(dateFrom) : undefined,
      dateTo: dateTo ? String(dateTo) : undefined,
    });

    return sendJson(response, 200, { payments });
  });
}
