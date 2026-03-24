import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withApiHandler, sendJson, readJsonBody, assertMethod, getQueryValue } from '../../src/server/shared/http.js';
import { requireTenantFromRequest } from '../../src/server/tenancy/resolver.js';
import { fetchMercadoPagoPayment } from '../../src/server/integrations/mercadopago/client.js';
import { syncPayment } from '../../src/server/payments/service.js';
import { createPaymentEvent } from '../../src/server/payments/repo.js';
import { createAuditLog } from '../../src/server/audit/service.js';

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
    
    if (!paymentId) {
        log.info('Webhook ignorado: paymentId não encontrado no payload', { payload_id: payload.id });
        return sendJson(response, 202, { received: true, ignored: true });
    }

    log.info('Processando webhook Mercado Pago', { 
        action: 'process_webhook', 
        paymentId, 
        mp_action: payload.action 
    });

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

    const mpPayment = await fetchMercadoPagoPayment(tenant.id, paymentId);
    log.info('Sincronizando status de pagamento', { paymentId, status: mpPayment.status });
    
    await syncPayment(tenant.id, paymentId, String(mpPayment.status), String(mpPayment.id));
    
    await createAuditLog(request, {
      tenantId: String(tenant.id),
      actorType: 'system',
      actorId: 'mercadopago_webhook',
      action: 'payment.webhook_received',
      resourceType: 'payment_order',
      resourceId: paymentId,
      payload: { 
        status: mpPayment.status,
        mp_id: mpPayment.id,
        action: payload.action
      },
    });

    return sendJson(response, 202, { success: true });
  });
}

