import type { VercelRequest, VercelResponse } from "@vercel/node";
import { withApiHandler, json, assertMethod, ApiError } from "../../src/server/shared/http.js";
import { verifyWebhookSignature } from "../../src/server/integrations/mercadopago/webhookSignature.js";
import { mpGetPayment } from "../../src/server/integrations/mercadopago/client.js";
import { baserowFetch } from "../../src/server/integrations/baserow/client.js";
import { baserowTables } from "../../src/server/integrations/baserow/tables.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return withApiHandler(req, res, async ({ requestId }) => {
    assertMethod(req, ["POST"]);

    const xSig = req.headers["x-signature"];
    const xReq = req.headers["x-request-id"];
    if (typeof xSig !== "string" || typeof xReq !== "string") {
      throw new ApiError(400, "Missing x-signature or x-request-id");
    }

    // data.id vem em query param (data.id) e, se for alfanumérico, deve ser usado em lowercase conforme doc MP.
    const dataIdUrl = String((req.query["data.id"] ?? req.query["id"] ?? "")).toLowerCase();
    if (!dataIdUrl) throw new ApiError(400, "Missing data.id query param");

    const ok = verifyWebhookSignature({ dataIdUrl, xRequestId: xReq, xSignature: xSig });
    if (!ok) throw new ApiError(401, "Invalid webhook signature");

    // O evento pode ser "payment". O body geralmente tem data.id do pagamento; consultamos o MP para verdade.
    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body ?? {});
    const paymentId = String(body?.data?.id ?? "");
    if (!paymentId) throw new ApiError(400, "Missing paymentId in body.data.id");

    const payment = await mpGetPayment(paymentId);
    const extRef = String(payment.external_reference ?? "");
    const status = String(payment.status ?? "pending");

    // Guardar evento (idempotência mínima por x-request-id + paymentId)
    const seen = await baserowFetch<{ results: any[] }>(
      `/api/database/rows/table/${baserowTables.paymentEvents}/?user_field_names=true&filter__x_request_id__equal=${encodeURIComponent(
        xReq
      )}&filter__mp_payment_id__equal=${encodeURIComponent(paymentId)}`
    );
    if (seen.results.length > 0) {
      return json(res, 200, { success: true, data: { ignored: true }, requestId });
    }

    await baserowFetch(`/api/database/rows/table/${baserowTables.paymentEvents}/?user_field_names=true`, {
      method: "POST",
      body: JSON.stringify({
        x_request_id: xReq,
        mp_payment_id: paymentId,
        event_data_id: dataIdUrl,
        raw_json: JSON.stringify(body),
        created_at: new Date().toISOString(),
      }),
    });

    // Encontrar order por external_reference
    const orders = await baserowFetch<{ results: any[] }>(
      `/api/database/rows/table/${baserowTables.paymentOrders}/?user_field_names=true&filter__external_reference__equal=${encodeURIComponent(extRef)}`
    );
    const order = orders.results[0];
    if (!order) throw new ApiError(404, "Order not found by external_reference");

    await baserowFetch(`/api/database/rows/table/${baserowTables.paymentOrders}/${order.id}/?user_field_names=true`, {
      method: "PATCH",
      body: JSON.stringify({
        status,
        mp_payment_id: paymentId,
        updated_at: new Date().toISOString(),
      }),
    });

    return json(res, 200, { success: true, data: { status }, requestId });
  });
}
