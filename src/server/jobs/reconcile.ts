import { fetchBaserow, BASEROW_TABLES } from "../baserow/client.js";
import { fetchMercadoPagoPayment } from "../payments/mercadoPago.js";
import { syncMercadoPagoPayment } from "../baserow/checkoutRepo.js";
import { logAuditEntry } from "../logging/audit.js";

export async function runReconciliationJob() {
  console.log("[Job] Starting payment reconciliation...");
  
  // 1. Buscar pagamentos pendentes nos últimos 3 dias
  const threeDaysAgo = new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString();
  // Nota: Filtro simplificado, idealmente usaria busca mais avançada
  const pendingPayments = await fetchBaserow<{ results: any[] }>(
    `/api/database/rows/table/${BASEROW_TABLES.PAYMENTS}/?user_field_names=true&filter__status__equal=pending`
  );

  let updatedCount = 0;

  for (const payment of pendingPayments.results) {
    try {
      if (!payment.paymentId) continue;
      
      const mpData = await fetchMercadoPagoPayment(payment.tenantId, payment.paymentId);
      if (mpData.status !== payment.status) {
        console.log(`[Job] Updating payment ${payment.id}: ${payment.status} -> ${mpData.status}`);
        await syncMercadoPagoPayment(payment.tenantId, mpData, { source: 'reconciliation_job' });
        updatedCount++;
      }
    } catch (err) {
      console.error(`[Job] Failed to reconcile payment ${payment.id}:`, err);
    }
  }

  await logAuditEntry(0, { 
    action: 'job_reconciliation', 
    resourceType: 'system', 
    details: { updatedCount, totalChecked: pendingPayments.results.length } 
  });

  return { updatedCount, totalChecked: pendingPayments.results.length };
}
