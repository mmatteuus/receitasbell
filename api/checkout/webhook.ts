import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withApiHandler, sendJson, readJsonBody, assertMethod, getQueryValue } from '../../src/server/http.js';
import { requireTenantFromRequest } from '../../src/server/tenants/resolver.js';
import { assertMercadoPagoWebhookSignature } from '../../src/server/payments/mercadoPago.js';
import { processIdempotentWebhook } from '../../src/server/payments/webhookService.js';

function extractPaymentId(request: VercelRequest, payload: any) {
    const data = payload.data;
    const queryId = getQueryValue(request.query.id as any) || getQueryValue(request.query['data.id'] as any);
    const directId = (data?.id) || payload.id || queryId;
    if (directId) return String(directId);
    const resource = payload.resource;
    const match = String(resource || "").match(/\/payments\/(\d+)/);
    return match?.[1] ?? null;
}

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return withApiHandler(request, response, async (log) => {
    assertMethod(request, ['POST']);
    const { tenant } = await requireTenantFromRequest(request);
    const payload = await readJsonBody<Record<string, any>>(request);
    const paymentId = extractPaymentId(request, payload);
    
    if (!paymentId) return sendJson(response, 202, { received: true, ignored: true });

    assertMercadoPagoWebhookSignature(request, paymentId);
    const result = await processIdempotentWebhook(String(tenant.id), paymentId, payload);
    
    return sendJson(response, 202, result);
  });
}
