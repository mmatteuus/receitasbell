import type { VercelRequest, VercelResponse } from "@vercel/node";
import { withApiHandler, json, requireCronAuth } from "../../src/server/shared/http.js";
import { logAuditEvent } from "../../src/server/audit/repo.js";
import { baserowFetch } from "../../src/server/integrations/baserow/client.js";
import { baserowTables } from "../../src/server/integrations/baserow/tables.js";
import { mpSearchPaymentsByExternalReference, MercadoPagoApiError } from "../../src/server/integrations/mercadopago/client.js";
import {
  getUsableMercadoPagoAccessToken,
  markConnectionReconnectRequired,
  refreshMercadoPagoConnection,
} from "../../src/server/integrations/mercadopago/connections.js";
import { buildPaymentExternalReference } from "../../src/server/payments/externalReference.js";
import { setPaymentOrderExternalReference } from "../../src/server/payments/repo.js";
import { syncPayment } from "../../src/server/payments/service.js";

type PaymentOrderRow = {
  id: string | number;
  tenant_id?: string | number;
  status?: string;
  external_reference?: string;
};

type MercadoPagoPaymentSummary = {
  id?: string | number;
  status?: string;
};

async function logReconcileAuditEvent(input: {
  tenantId: string;
  action: "webhook.payment_synced" | "webhook.payment_sync_failed";
  paymentOrderId: string;
  providerPaymentId?: string | null;
  connectionId?: string | null;
  payload?: Record<string, unknown>;
}) {
  await logAuditEvent({
    tenantId: input.tenantId,
    actorType: "system",
    actorId: "system",
    action: input.action,
    resourceType: "payment_order",
    resourceId: input.paymentOrderId,
    payload: {
      paymentOrderId: input.paymentOrderId,
      providerPaymentId: input.providerPaymentId || null,
      connectionId: input.connectionId || null,
      source: "reconcile",
      ...(input.payload || {}),
    },
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return withApiHandler(req, res, async ({ requestId, logger }) => {
    requireCronAuth(req);

    // Find orders still pending (paginated)
    let page = 1;
    let hasMore = true;
    const allOrders: PaymentOrderRow[] = [];

    while (hasMore) {
      const data = await baserowFetch<{ results: PaymentOrderRow[]; next: string | null }>(
        `/api/database/rows/table/${baserowTables.paymentOrders}/?user_field_names=true&filter__status__equal=pending&page=${page}&size=200`
      );
      allOrders.push(...data.results);
      hasMore = data.next !== null;
      page++;
    }

    let updated = 0;
    const tokenCache = new Map<string, { accessToken: string; connectionId: string }>();
    for (const order of allOrders) {
      const extRef = String(order.external_reference || "");
      const tenantId = String(order.tenant_id);
      const fallbackExtRef = buildPaymentExternalReference(tenantId, String(order.id));
      const referencesToTry = extRef && extRef !== fallbackExtRef
        ? [extRef, fallbackExtRef]
        : [fallbackExtRef];

      try {
        let tokenEntry = tokenCache.get(tenantId);
        if (!tokenEntry) {
          const resolved = await getUsableMercadoPagoAccessToken(tenantId);
          tokenEntry = {
            accessToken: resolved.accessToken,
            connectionId: resolved.connection.id,
          };
          tokenCache.set(tenantId, tokenEntry);
        }

        const searchLatestPayment = async (accessToken: string) => {
          let latest: MercadoPagoPaymentSummary | null = null;
          let matchedReference = "";
          for (const reference of referencesToTry) {
            const mpData = await mpSearchPaymentsByExternalReference(accessToken, reference);
            latest = mpData.results?.[0] || null;
            if (latest) {
              matchedReference = reference;
              break;
            }
          }
          return { latest, matchedReference };
        };

        let latest: MercadoPagoPaymentSummary | null = null;
        let matchedReference = "";
        try {
          const result = await searchLatestPayment(tokenEntry.accessToken);
          latest = result.latest;
          matchedReference = result.matchedReference;
        } catch (error) {
          if (!(error instanceof MercadoPagoApiError) || (error.status !== 401 && error.status !== 403)) {
            throw error;
          }

          logger.warn("webhook.payment_sync_failed", {
            action: "webhook.payment_sync_failed",
            tenantId,
            paymentOrderId: String(order.id),
            providerPaymentId: null,
            connectionId: tokenEntry.connectionId,
            checkoutUrlKind: null,
            reason: "token_rejected_first_attempt",
            source: "reconcile",
            status: error.status,
          });

          try {
            await refreshMercadoPagoConnection(tokenEntry.connectionId);
            const retryResolution = await getUsableMercadoPagoAccessToken(tenantId);
            tokenEntry = {
              accessToken: retryResolution.accessToken,
              connectionId: retryResolution.connection.id,
            };
            tokenCache.set(tenantId, tokenEntry);
            const retryResult = await searchLatestPayment(tokenEntry.accessToken);
            latest = retryResult.latest;
            matchedReference = retryResult.matchedReference;
          } catch (retryError) {
            await markConnectionReconnectRequired({
              tenantId,
              reason: "token_rejected_after_refresh",
            });
            await logReconcileAuditEvent({
              tenantId,
              action: "webhook.payment_sync_failed",
              paymentOrderId: String(order.id),
              providerPaymentId: null,
              connectionId: tokenEntry.connectionId,
              payload: {
                reason: "token_rejected_after_refresh",
              },
            });
            logger.warn("webhook.payment_sync_failed", {
              action: "webhook.payment_sync_failed",
              tenantId,
              paymentOrderId: String(order.id),
              providerPaymentId: null,
              connectionId: tokenEntry.connectionId,
              checkoutUrlKind: null,
              reason: "token_rejected_after_refresh",
              source: "reconcile",
            });
            continue;
          }
        }

        if (matchedReference && matchedReference !== extRef) {
          await setPaymentOrderExternalReference(tenantId, String(order.id), matchedReference);
        }

        if (latest && latest.status !== order.status) {
          await syncPayment(tenantId, String(order.id), String(latest.status), String(latest.id));
          await logReconcileAuditEvent({
            tenantId,
            action: "webhook.payment_synced",
            paymentOrderId: String(order.id),
            providerPaymentId: String(latest.id || ""),
            connectionId: tokenEntry.connectionId,
            payload: {
              status: String(latest.status),
            },
          });
          logger.info("webhook.payment_synced", {
            action: "webhook.payment_synced",
            tenantId,
            paymentOrderId: String(order.id),
            providerPaymentId: String(latest.id || ""),
            connectionId: tokenEntry.connectionId,
            checkoutUrlKind: null,
            source: "reconcile",
          });
          updated++;
        }
      } catch (e) {
        if (e instanceof MercadoPagoApiError && (e.status === 401 || e.status === 403)) {
          await markConnectionReconnectRequired({
            tenantId,
            reason: "token_rejected_by_mercadopago",
          });
        }
        await logReconcileAuditEvent({
          tenantId,
          action: "webhook.payment_sync_failed",
          paymentOrderId: String(order.id),
          providerPaymentId: null,
          connectionId: tokenCache.get(tenantId)?.connectionId || null,
          payload: {
            reason: e instanceof MercadoPagoApiError && (e.status === 401 || e.status === 403)
              ? "token_rejected_by_mercadopago"
              : "reconcile_failed",
            errorMessage: e instanceof Error ? e.message : String(e),
          },
        });
        logger.error("webhook.payment_sync_failed", {
          action: "webhook.payment_sync_failed",
          tenantId,
          paymentOrderId: String(order.id),
          providerPaymentId: null,
          connectionId: tokenCache.get(tenantId)?.connectionId || null,
          checkoutUrlKind: null,
          source: "reconcile",
          error: e,
        });
      }
    }

    return json(res, 200, { success: true, data: { updated }, requestId });
  });
}
