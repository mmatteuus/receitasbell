import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getMercadoPagoEnv, hasMercadoPagoConfig } from "../../../src/server/env.js";
import { syncMercadoPagoPayment } from "../../../src/server/sheets/paymentsRepo.js";
import { getSettingsMap, mapTypedSettings } from "../../../src/server/sheets/settingsRepo.js";
import { assertMercadoPagoWebhookSignature } from "../../../src/server/payments/mercadoPago.js";
import { ApiError, assertMethod, readJsonBody, sendJson, withApiHandler } from "../../../src/server/http.js";

function getQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function asText(value: unknown) {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  if (typeof value === "number" || typeof value === "bigint") {
    return String(value);
  }

  return null;
}

function extractMercadoPagoPaymentId(request: VercelRequest, payload: Record<string, unknown>) {
  const data = asRecord(payload.data);
  const queryId =
    getQueryValue(request.query.id as string | string[] | undefined) ||
    getQueryValue(request.query["data.id"] as string | string[] | undefined);
  const directId = asText(data?.id) || asText(payload.id) || asText(queryId);

  if (directId) {
    return directId;
  }

  const resource = asText(payload.resource);
  const match = resource?.match(/\/payments\/(\d+)/);
  return match?.[1] ?? null;
}

async function fetchMercadoPagoPayment(paymentId: string) {
  const { accessToken } = getMercadoPagoEnv();
  const response = await fetch(
    `https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    },
  );

  if (!response.ok) {
    throw new ApiError(502, `Mercado Pago payment lookup failed with status ${response.status}`);
  }

  return (await response.json()) as Record<string, unknown>;
}

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return withApiHandler(request, response, async () => {
    assertMethod(request, ["POST"]);

    const settings = mapTypedSettings(await getSettingsMap());
    if (!hasMercadoPagoConfig()) {
      throw new ApiError(501, "Mercado Pago webhook is not enabled in this environment");
    }

    if (!settings.webhooks_enabled) {
      throw new ApiError(503, "Mercado Pago webhook processing is disabled");
    }

    const payload = await readJsonBody<Record<string, unknown>>(request);
    const paymentId = extractMercadoPagoPaymentId(request, payload);

    if (!paymentId) {
      return sendJson(response, 202, {
        received: true,
        ignored: true,
        message: "Webhook received without a payment id",
      });
    }

    assertMercadoPagoWebhookSignature(request, paymentId);
    const paymentPayload = await fetchMercadoPagoPayment(paymentId);
    const payment = await syncMercadoPagoPayment(paymentPayload, payload);

    return sendJson(response, 202, {
      received: true,
      paymentId,
      internalPaymentId: payment.id,
      status: payment.status,
    });
  });
}
