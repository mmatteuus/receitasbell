import { fetchBaserow } from "../integrations/baserow/client.js";
import { baserowTables as BASEROW_TABLES } from "../integrations/baserow/tables.js";
import { fetchMercadoPagoPayment } from "../integrations/mercadopago/client.js";
import { syncPayment } from "../payments/service.js";
import { Logger } from "../shared/logger.js";

const logger = new Logger({ job: "reconcile" });

export async function runReconciliationJob() {
  logger.info("Starting payment reconciliation job...");
  
  // Fetch pending and created payments
  const pendingPayments = await fetchBaserow<{ results: any[] }>(
    `/api/database/rows/table/${BASEROW_TABLES.PAYMENTS}/?user_field_names=true&filter__status__in=pending,created`
  );

  let updatedCount = 0;
  let errorCount = 0;

  for (const payment of pendingPayments.results) {
    try {
      const provId = payment.payment_id || payment.paymentId;
      if (!provId) continue;
      
      const mpData = await fetchMercadoPagoPayment(payment.tenantId, String(provId));
      const mpStatus = String(mpData.status || 'pending');

      if (mpStatus !== payment.status) {
        logger.info(`Updating payment ${payment.id}: ${payment.status} -> ${mpStatus}`, {
            paymentOrderId: payment.id,
            tenantId: payment.tenantId,
            newStatus: mpStatus
        });
        
        await syncPayment(payment.tenantId, payment.id, mpStatus, String(provId));
        updatedCount++;
      }
    } catch (err: any) {
      errorCount++;
      logger.error(`Failed to reconcile payment ${payment.id}`, { error: err?.message || err });
    }
  }

  logger.info("Reconciliation job completed", { 
      totalProcessed: pendingPayments.results.length, 
      updatedCount, 
      errorCount 
  });

  return { updatedCount, totalChecked: pendingPayments.results.length, errorCount };
}
