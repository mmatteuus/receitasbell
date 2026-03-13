import type { VercelRequest, VercelResponse } from "@vercel/node";
import { ApiError, assertMethod, readJsonBody, requireAdminAccess, sendJson, withApiHandler } from "../../../src/server/http.js";
import { addPaymentNote } from "../../../src/server/sheets/paymentsRepo.js";
import { noteSchema } from "../../../src/server/validators.js";

function getPaymentId(request: VercelRequest) {
  const raw = request.query.id;
  return Array.isArray(raw) ? raw[0] : raw;
}

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return withApiHandler(request, response, async () => {
    assertMethod(request, ["POST"]);
    requireAdminAccess(request);

    const paymentId = getPaymentId(request);
    if (!paymentId) {
      throw new ApiError(400, "Payment id is required");
    }

    const body = noteSchema.parse(await readJsonBody(request));
    const note = await addPaymentNote(paymentId, body.note);
    return sendJson(response, 201, { note });
  });
}
