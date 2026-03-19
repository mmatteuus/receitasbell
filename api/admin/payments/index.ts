import type { VercelRequest, VercelResponse } from "@vercel/node";
import { listPayments } from "../../../src/server/sheets/paymentsRepo.js";
import { ApiError, assertMethod, parseStringArray, requireAdminAccess, sendJson, withApiHandler } from "../../../src/server/http.js";

function getQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function readPaymentsFilters(request: VercelRequest) {
  const status = parseStringArray(request.query.status);
  const paymentMethod = parseStringArray(request.query.method || request.query.paymentMethod);
  const email = getQueryValue(request.query.email as string | string[] | undefined);
  const paymentId = getQueryValue(request.query.paymentId as string | string[] | undefined);
  const externalReference =
    getQueryValue(request.query.externalReference as string | string[] | undefined) ||
    getQueryValue(request.query.external_reference as string | string[] | undefined);
  const dateFrom = getQueryValue(request.query.dateFrom as string | string[] | undefined);
  const dateTo = getQueryValue(request.query.dateTo as string | string[] | undefined);

  return {
    status: status as never,
    paymentMethod,
    email: email ? String(email) : undefined,
    paymentId: paymentId ? String(paymentId) : undefined,
    externalReference: externalReference ? String(externalReference) : undefined,
    dateFrom: dateFrom ? String(dateFrom) : undefined,
    dateTo: dateTo ? String(dateTo) : undefined,
  };
}

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return withApiHandler(request, response, async () => {
    assertMethod(request, ["GET"]);
    requireAdminAccess(request);
    const payments = await listPayments(readPaymentsFilters(request));
    return sendJson(response, 200, { payments });
  });
}
