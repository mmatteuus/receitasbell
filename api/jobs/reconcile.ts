import type { VercelRequest, VercelResponse } from "@vercel/node";
import { withApiHandler, json, requireCronAuth } from "../../src/server/shared/http.js";
import { baserowFetch } from "../../src/server/integrations/baserow/client.js";
import { baserowTables } from "../../src/server/integrations/baserow/tables.js";
import { mpSearchPaymentsByExternalReference } from "../../src/server/integrations/mercadopago/client.js";
import { updatePaymentOrderStatus } from "../../src/server/payments/repo.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return withApiHandler(req, res, async ({ requestId }) => {
    requireCronAuth(req);

    // Find orders still pending
    const data = await baserowFetch<{ results: any[] }>(
      `/api/database/rows/table/${baserowTables.paymentOrders}/?user_field_names=true&filter__status__equal=pending`
    );

    let updated = 0;
    for (const order of data.results) {
      const extRef = String(order.external_reference);
      const tenantId = String(order.tenant_id);

      try {
        const mpData = await mpSearchPaymentsByExternalReference(extRef);
        const latest = mpData.results?.[0];
        if (latest && latest.status !== order.status) {
          await updatePaymentOrderStatus(tenantId, order.id, latest.status, String(latest.id));
          updated++;
        }
      } catch (e) {
        console.error(`Reconcile failed for order ${order.id}:`, e);
      }
    }

    return json(res, 200, { success: true, data: { updated }, requestId });
  });
}
