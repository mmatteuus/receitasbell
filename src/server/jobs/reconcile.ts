import { baserowFetch, BASEROW_TABLES } from "../integrations/baserow/client.js";
import { fetchMercadoPagoPayment } from "../integrations/mercadopago/client.js";
import { syncPayment } from "../payments/service.js";
import { Logger } from "../shared/logger.js";

const logger = new Logger({ job: "reconcile" });

export async function runReconciliationJob() {
  logger.info("Starting payment reconciliation job...");
  
  // Fetch pending and created payments within the last 7 days to avoid excessive processing
  // (In real scenario, could filter by updated_at > now - 7d)
  const pendingPayments = await baserowFetch<{ results: any[] }>(
    `/api/database/rows/table/${BASEROW_TABLES.PAYMENTS}/?user_field_names=true&filter__status__in=pending,created`
  );

  let updatedCount = 0;
  let errorCount = 0;

  for (const payment of pendingPayments.results) {
    try {
      // Need provider_payment_id or preference_id to reconcile
      const provId = payment.payment_id;
      if (!provId) continue;
      
      const mpData = await fetchMercadoPagoPayment(payment.tenantId, provId);
      const mpStatus = String(mpData.status || 'pending');

      if (mpStatus !== payment.status) {
        logger.info(`Updating payment ${payment.id}: ${payment.status} -> ${mpStatus}`, {
            paymentOrderId: payment.id,
            tenantId: payment.tenantId,
            newStatus: mpStatus
        });
        
        await syncPayment(payment.tenantId, payment.id, mpStatus, provId);
        updatedCount++;
      }
    } catch (err) {
      errorCount++;
      logger.error(`Failed to reconcile payment ${payment.id}`, { error: err instanceof Error ? err.message : err });
    }
  }

  logger.info("Reconciliation job completed", { 
      totalProcessed: pendingPayments.results.length, 
      updatedCount, 
      errorCount 
  });

  return { updatedCount, totalChecked: pendingPayments.results.length, errorCount };
}
