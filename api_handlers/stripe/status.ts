import type { VercelRequest, VercelResponse } from "@vercel/node";
import { withApiHandler, json, assertMethod, getQueryValue, ApiError } from "../../src/server/shared/http.js";
import { requireTenantFromRequest } from "../../src/server/tenancy/resolver.js";
import { getPaymentOrderById } from "../../src/server/payments/repo.js";

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return withApiHandler(request, response, async ({ requestId }) => {
    assertMethod(request, ["GET"]);
    const orderId = getQueryValue(request, "orderId") || getQueryValue(request, "id");
    if (!orderId) throw new ApiError(400, "orderId e obrigatorio.");
    const { tenant } = await requireTenantFromRequest(request);
    const order = await getPaymentOrderById(tenant.id, orderId);
    if (!order) throw new ApiError(404, "Pedido nao encontrado.");
    return json(response, 200, { paymentOrderId: String(order.id), status: order.status, paymentMethod: order.paymentMethod, provider: order.provider, requestId });
  });
}
