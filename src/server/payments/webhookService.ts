import { ApiError } from "../http.js";
import { fetchBaserow, BASEROW_TABLES } from "../baserow/client.js";
import { syncMercadoPagoPayment } from "../baserow/checkoutRepo.js";

export async function processIdempotentWebhook(tenantId: string | number, paymentId: string, payload: any) {
  // 1. Verificar se o evento já foi processado (Deduplicação)
  // Nota: Mercado Pago envia 'id' do evento na notificação.
  const eventId = String(payload.id || payload.data?.id || "");
  
  if (eventId) {
    const existing = await fetchBaserow<{ results: any[] }>(
        `/api/database/rows/table/${BASEROW_TABLES.PAYMENT_EVENTS}/?user_field_names=true&filter__tenantId__equal=${tenantId}&filter__provider_event_id__equal=${eventId}`
    );
    
    if (existing.results.length > 0) {
        console.log(`[Webhook] Event ${eventId} already processed. Skipping.`);
        return { received: true, deduplicated: true, status: existing.results[0].provider_status };
    }
  }

  // 2. Buscar dados reais do pagamento no Mercado Pago (evitar confiança no payload)
  const { fetchMercadoPagoPayment } = await import("../payments/mercadoPago.js");
  const paymentPayload = await fetchMercadoPagoPayment(tenantId, paymentId);
  
  // 3. Processar o pagamento (Atomicidade simulada via sincronização)
  const result = await syncMercadoPagoPayment(tenantId, paymentPayload, payload);
  
  // 4. Registrar o evento para auditoria e futura deduplicação
  await fetchBaserow(
    `/api/database/rows/table/${BASEROW_TABLES.PAYMENT_EVENTS}/?user_field_names=true`,
    {
      method: "POST",
      body: JSON.stringify({
        tenantId: String(tenantId),
        payment_order_id: String(result.id || ""),
        provider_event_id: eventId,
        provider_status: String(result.status || "unknown"),
        payload_json: JSON.stringify(payload),
        processed_at: new Date().toISOString(),
      }),
    }
  );

  return { 
    received: true, 
    paymentId, 
    internalPaymentId: result.id, 
    status: result.status 
  };
}
