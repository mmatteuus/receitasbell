import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withApiHandler, sendJson, readJsonBody, assertMethod, getQueryValue } from '../../src/server/shared/http.js';
import { requireTenantFromRequest } from '../../src/server/domains/tenants/resolver.js';
import { fetchMercadoPagoPayment } from '../../src/server/integrations/mercadopago/service.js';
import { syncPayment } from '../../src/server/domains/payments/service.js';
import { createPaymentEvent } from '../../src/server/domains/payments/repo.js';

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

    // T4/T5: Persist Event for Idempotency/Audit
    const dedupeKey = `mp_evt_${payload.id || paymentId}_${payload.action || 'sync'}`;
    await createPaymentEvent(tenant.id, {
        tenantId: tenant.id,
        paymentId,
        dedupeKey,
        topic: payload.topic || payload.type,
        action: payload.action,
        payloadJson: payload,
        createdAt: new Date().toISOString(),
    });

    // Signature verification placeholder (MP signature validation should be here)
    
    const mpPayment = await fetchMercadoPagoPayment(tenant.id, paymentId);
    await syncPayment(tenant.id, paymentId, String(mpPayment.status), String(mpPayment.id));
    
    return sendJson(response, 202, { success: true });
  });
}
