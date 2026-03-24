import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withApiHandler, json, assertMethod, getQueryValue } from '../../src/server/shared/http.js';
import { requireTenantFromRequest } from '../../src/server/tenancy/resolver.js';
import { assertMercadoPagoWebhookSignature, processMercadoPagoWebhook } from '../../src/server/integrations/mercadopago/webhook.js';
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
  return withApiHandler(request, response, async ({ requestId }) => {
    assertMethod(request, ['POST']);
    
    // No CSRF required for external webhooks
    
    const { tenant } = await requireTenantFromRequest(request);
    const payload = request.body;
    const paymentId = extractPaymentId(request, payload);
    
    if (!paymentId) {
        return json(response, 202, { received: true, ignored: true, requestId });
    }

    // Enforce Signature Verification (Phase 2 hardening)
    let signatureValid = false;
    try {
      await assertMercadoPagoWebhookSignature(request, paymentId);
      signatureValid = true;
    } catch (err) {
      // In Phase 2, we log if invalid but might still process if it matches our DB 
      // OR we reject. Per Plano 10/10, we should reject.
      throw err; 
    }

    await processMercadoPagoWebhook(tenant.id, payload, signatureValid);
    
    await createAuditLog(request, {
      tenantId: String(tenant.id),
      actorType: 'system',
      actorId: 'mercadopago_webhook',
      action: 'payment.webhook_processed',
      resourceType: 'payment_order',
      resourceId: paymentId,
      payload: { 
        topic: payload.topic || payload.type,
        action: payload.action,
        signatureValid
      },
    });

    return json(response, 202, { success: true, requestId });
  });
}

