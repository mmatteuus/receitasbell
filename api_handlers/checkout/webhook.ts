import type { VercelRequest, VercelResponse } from "@vercel/node";
import { withApiHandler, json, assertMethod, ApiError } from "../../src/server/shared/http.js";
import { verifyWebhookSignature } from "../../src/server/integrations/mercadopago/webhookSignature.js";
import { mpGetPayment, MercadoPagoApiError } from "../../src/server/integrations/mercadopago/client.js";
import { logAuditEvent } from "../../src/server/audit/repo.js";
import { baserowFetch } from "../../src/server/integrations/baserow/client.js";
import { baserowTables } from "../../src/server/integrations/baserow/tables.js";
import {
  getUsableMercadoPagoAccessToken,
  markConnectionReconnectRequired,
  refreshMercadoPagoConnection,
} from "../../src/server/integrations/mercadopago/connections.js";
import { getPaymentOrderById } from "../../src/server/payments/repo.js";
import { parsePaymentExternalReference } from "../../src/server/payments/externalReference.js";
import { syncPayment } from "../../src/server/payments/service.js";

type PaymentOrderRow = {
  id?: string | number;
  tenant_id?: string | number;
  tenantId?: string | number;
};

type MercadoPagoPayment = {
  external_reference?: string;
  status?: string;
  [key: string]: unknown;
};

function getQueryValue(request: VercelRequest, key: string) {
  const value = request.query[key];
  if (typeof value === "string") return value;
  if (Array.isArray(value) && value.length) return String(value[0]);
  return "";
}

async function findOrderIdByExternalReference(externalReference: string) {
  if (!externalReference) return null;
  const orders = await baserowFetch<{ results: PaymentOrderRow[] }>(
    `/api/database/rows/table/${baserowTables.paymentOrders}/?user_field_names=true&filter__external_reference__equal=${encodeURIComponent(externalReference)}`
  );
  const order = orders.results[0];
  if (!order) return null;
  return {
    id: String(order.id),
    tenantId: String(order.tenant_id),
  };
}

async function logWebhookAuditEvent(input: {
  tenantId: string;
  action: "webhook.payment_synced" | "webhook.payment_sync_failed";
  paymentOrderId?: string | null;
  providerPaymentId: string;
  connectionId?: string | null;
  payload?: Record<string, unknown>;
}) {
  await logAuditEvent({
    tenantId: input.tenantId,
    actorType: "system",
    actorId: "system",
    action: input.action,
    resourceType: "payment_order",
    resourceId: input.paymentOrderId || input.providerPaymentId || "unknown",
    payload: {
      paymentOrderId: input.paymentOrderId || null,
      providerPaymentId: input.providerPaymentId,
      connectionId: input.connectionId || null,
      source: "webhook",
      ...(input.payload || {}),
    },
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return withApiHandler(req, res, async ({ requestId, logger }) => {
    assertMethod(req, ["POST"]);

    const xSig = req.headers["x-signature"];
    const xReq = req.headers["x-request-id"];
    if (typeof xSig !== "string" || typeof xReq !== "string") {
      throw new ApiError(400, "Missing x-signature or x-request-id");
    }

    const dataIdUrl = String((req.query["data.id"] ?? req.query["id"] ?? "")).toLowerCase();
    if (!dataIdUrl) throw new ApiError(400, "Missing data.id query param");

    const ok = verifyWebhookSignature({ dataIdUrl, xRequestId: xReq, xSignature: xSig });
    if (!ok) {
      logger.warn("webhook.signature_invalid", {
        dataIdUrl,
        xRequestId: xReq,
        reason: "hmac_mismatch",
      });
      return json(res, 200, { success: false, reason: "invalid_signature", requestId });
    }

    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body ?? {});
    const providerPaymentId = String(body?.data?.id ?? dataIdUrl ?? "");
    if (!providerPaymentId) throw new ApiError(400, "Missing paymentId in body.data.id");

    const seen = await baserowFetch<{ results: Record<string, unknown>[] }>(
      `/api/database/rows/table/${baserowTables.paymentEvents}/?user_field_names=true&filter__x_request_id__equal=${encodeURIComponent(
        xReq
      )}&filter__mp_payment_id__equal=${encodeURIComponent(providerPaymentId)}`
    );
    if (seen.results.length > 0) {
      return json(res, 200, { success: true, data: { ignored: true }, requestId });
    }

    const hintedOrderId = getQueryValue(req, "paymentId");
    const hintedTenantId = getQueryValue(req, "tenantId");
    let resolvedTenantId = hintedTenantId || "";
    let resolvedOrderId = hintedOrderId || "";

    if (hintedOrderId) {
      const hintedOrder = await baserowFetch<PaymentOrderRow>(
        `/api/database/rows/table/${baserowTables.paymentOrders}/${hintedOrderId}/?user_field_names=true`
      ).catch(() => null);
      if (hintedOrder) {
        resolvedTenantId = resolvedTenantId || String(hintedOrder.tenant_id);
        resolvedOrderId = String(hintedOrder.id);
      }
    }

    if (!resolvedTenantId) {
      throw new ApiError(400, "Unable to resolve tenant for webhook event.");
    }

    const tokenResolution = await getUsableMercadoPagoAccessToken(String(resolvedTenantId));
    let connectionId = tokenResolution.connection.id;
    let payment: MercadoPagoPayment;
    try {
      payment = await mpGetPayment(tokenResolution.accessToken, providerPaymentId);
    } catch (error) {
      if (error instanceof MercadoPagoApiError && (error.status === 401 || error.status === 403)) {
        logger.warn("webhook.payment_sync_failed", {
          action: "webhook.payment_sync_failed",
          tenantId: resolvedTenantId,
          paymentOrderId: resolvedOrderId || null,
          providerPaymentId,
          connectionId,
          checkoutUrlKind: null,
          reason: "token_rejected_first_attempt",
          status: error.status,
        });
        try {
          const refreshedConnection = await refreshMercadoPagoConnection(connectionId);
          connectionId = refreshedConnection.id;
          const retryResolution = await getUsableMercadoPagoAccessToken(String(resolvedTenantId));
          connectionId = retryResolution.connection.id;
          payment = await mpGetPayment(retryResolution.accessToken, providerPaymentId);
        } catch (retryError) {
          if (retryError instanceof MercadoPagoApiError && (retryError.status === 401 || retryError.status === 403)) {
            await markConnectionReconnectRequired({
              tenantId: resolvedTenantId,
              reason: "token_rejected_after_refresh",
            });
          } else {
            await markConnectionReconnectRequired({
              tenantId: resolvedTenantId,
              reason: "token_refresh_failed_after_rejection",
            });
          }

          await logWebhookAuditEvent({
            tenantId: resolvedTenantId,
            action: "webhook.payment_sync_failed",
            paymentOrderId: resolvedOrderId || null,
            providerPaymentId,
            connectionId,
            payload: {
              reason: retryError instanceof MercadoPagoApiError && (retryError.status === 401 || retryError.status === 403)
                ? "token_rejected_after_refresh"
                : "token_refresh_failed_after_rejection",
            },
          });
          logger.warn("webhook.payment_sync_failed", {
            action: "webhook.payment_sync_failed",
            tenantId: resolvedTenantId,
            paymentOrderId: resolvedOrderId || null,
            providerPaymentId,
            connectionId,
            checkoutUrlKind: null,
            reason: "token_rejected_after_refresh",
          });
          throw new ApiError(409, "A conexão do Mercado Pago expirou. Reconecte a conta para continuar.");
        }
      } else {
        await logWebhookAuditEvent({
          tenantId: resolvedTenantId,
          action: "webhook.payment_sync_failed",
          paymentOrderId: resolvedOrderId || null,
          providerPaymentId,
          connectionId,
          payload: {
            reason: "provider_lookup_failed",
            errorMessage: error instanceof Error ? error.message : String(error),
          },
        });
        logger.error("webhook.payment_sync_failed", {
          action: "webhook.payment_sync_failed",
          tenantId: resolvedTenantId,
          paymentOrderId: resolvedOrderId || null,
          providerPaymentId,
          connectionId,
          checkoutUrlKind: null,
          error,
        });
        throw error;
      }
    }
    const externalReference = String(payment?.external_reference ?? "");
    const paymentStatus = String(payment?.status ?? "pending");

    const parsedReference = parsePaymentExternalReference(externalReference);
    if (parsedReference) {
      resolvedTenantId = parsedReference.tenantId;
      resolvedOrderId = parsedReference.paymentOrderId;
    }

    if (!resolvedOrderId && externalReference) {
      const byReference = await findOrderIdByExternalReference(externalReference);
      if (byReference) {
        resolvedOrderId = byReference.id;
        resolvedTenantId = byReference.tenantId;
      }
    }

    if (!resolvedOrderId || !resolvedTenantId) {
      throw new ApiError(404, "Order not found by external_reference.");
    }

    const order = await getPaymentOrderById(resolvedTenantId, resolvedOrderId);
    if (!order) {
      throw new ApiError(404, "Order not found for tenant.");
    }

    await baserowFetch(`/api/database/rows/table/${baserowTables.paymentEvents}/?user_field_names=true`, {
      method: "POST",
      body: JSON.stringify({
        x_request_id: xReq,
        mp_payment_id: providerPaymentId,
        event_data_id: dataIdUrl,
        raw_json: JSON.stringify(body),
        created_at: new Date().toISOString(),
      }),
    });

    try {
      await syncPayment(order.tenantId, order.id, paymentStatus, providerPaymentId);
      await logWebhookAuditEvent({
        tenantId: String(order.tenantId),
        action: "webhook.payment_synced",
        paymentOrderId: String(order.id),
        providerPaymentId,
        connectionId,
        payload: {
          status: paymentStatus,
        },
      });
      logger.info("webhook.payment_synced", {
        action: "webhook.payment_synced",
        tenantId: String(order.tenantId),
        paymentOrderId: String(order.id),
        providerPaymentId,
        connectionId,
        checkoutUrlKind: null,
      });
    } catch (error) {
      await logWebhookAuditEvent({
        tenantId: String(order.tenantId),
        action: "webhook.payment_sync_failed",
        paymentOrderId: String(order.id),
        providerPaymentId,
        connectionId,
        payload: {
          reason: "sync_payment_failed",
          status: paymentStatus,
          errorMessage: error instanceof Error ? error.message : String(error),
        },
      });
      logger.error("webhook.payment_sync_failed", {
        action: "webhook.payment_sync_failed",
        tenantId: String(order.tenantId),
        paymentOrderId: String(order.id),
        providerPaymentId,
        connectionId,
        checkoutUrlKind: null,
        error,
      });
      throw error;
    }

    return json(res, 200, {
      success: true,
      data: {
        status: paymentStatus,
        paymentOrderId: String(order.id),
        tenantId: String(order.tenantId),
      },
      requestId,
    });
  });
}
