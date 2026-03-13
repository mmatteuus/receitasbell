import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getMercadoPagoEnv, hasMercadoPagoConfig } from "../../src/server/env.js";
import { ApiError, assertMethod, readJsonBody, sendJson, withApiHandler } from "../../src/server/http.js";
import { syncMercadoPagoPayment } from "../../src/server/sheets/paymentsRepo.js";

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

function extractPaymentId(request: VercelRequest, payload: Record<string, unknown>) {
  const data = asRecord(payload.data);
  const queryId =
    (Array.isArray(request.query.id) ? request.query.id[0] : request.query.id) ||
    (Array.isArray(request.query["data.id"]) ? request.query["data.id"][0] : request.query["data.id"]);
  const directId = asText(data?.id) || asText(payload.id) || (typeof queryId === "string" ? queryId : null);

  if (directId) {
    return directId;
  }

  const resource = asText(payload.resource);
  const match = resource?.match(/\/payments\/(\d+)/);
  return match?.[1] ?? null;
}

async function fetchMercadoPagoPayment(paymentId: string) {
  const { accessToken } = getMercadoPagoEnv();
  const response = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new ApiError(502, `Mercado Pago payment lookup failed with status ${response.status}`);
  }

  return (await response.json()) as Record<string, unknown>;
}

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return withApiHandler(request, response, async () => {
    assertMethod(request, ["POST"]);

    if (!hasMercadoPagoConfig()) {
      throw new ApiError(501, "Mercado Pago webhook is not enabled in this environment");
    }

    const payload = await readJsonBody<Record<string, unknown>>(request);
    const paymentId = extractPaymentId(request, payload);

    if (!paymentId) {
      return sendJson(response, 202, {
        received: true,
        ignored: true,
        message: "Webhook received without a payment id",
      });
    }

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
