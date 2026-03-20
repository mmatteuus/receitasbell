import type { VercelRequest } from "@vercel/node";
import { createHmac, timingSafeEqual } from "node:crypto";
import { getMercadoPagoWebhookSecret } from "../env.js";
import { ApiError } from "../http.js";
import {
  fetchMercadoPagoPaymentDetails,
  registerTenantWebhookReceipt,
  syncTenantMercadoPagoPayment,
} from "./payments.js";

type MercadoPagoSignatureParts = {
  ts: string;
  v1: string;
};

function asSingle(value: string | string[] | undefined) {
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

function parseSignatureHeader(header: string) {
  const parts = header
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((acc, part) => {
      const [rawKey, ...rawValue] = part.split("=");
      if (!rawKey || !rawValue.length) {
        return acc;
      }
      acc[rawKey.trim()] = rawValue.join("=").trim();
      return acc;
    }, {});

  const ts = parts.ts;
  const v1 = parts.v1;
  if (!ts || !v1) {
    throw new ApiError(400, "Malformed Mercado Pago signature header");
  }

  return {
    ts,
    v1,
  } satisfies MercadoPagoSignatureParts;
}

function signaturesMatch(expected: string, received: string) {
  try {
    return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(received, "hex"));
  } catch {
    return false;
  }
}

function parseExternalReference(value: string | null) {
  const match = value?.match(/^t:([^:]+):p:([^:]+)$/);
  if (!match) return null;
  return {
    tenantId: match[1],
    paymentId: match[2],
  };
}

export function buildMercadoPagoWebhookManifest(paymentId: string, requestId: string, ts: string) {
  return `id:${paymentId};request-id:${requestId};ts:${ts};`;
}

export async function verifyMercadoPagoWebhookSignature(
  paymentId: string,
  requestId: string,
  signature: MercadoPagoSignatureParts,
) {
  const webhookSecret = getMercadoPagoWebhookSecret();
  const manifest = buildMercadoPagoWebhookManifest(paymentId, requestId, signature.ts);
  const digest = createHmac("sha256", webhookSecret).update(manifest).digest("hex");
  return signaturesMatch(digest, signature.v1.toLowerCase());
}

export async function assertMercadoPagoWebhookSignature(request: VercelRequest, paymentId: string) {
  const signatureHeader = asSingle(request.headers["x-signature"]);
  const requestId = asSingle(request.headers["x-request-id"]);

  if (!signatureHeader || !requestId) {
    throw new ApiError(401, "Missing Mercado Pago webhook signature headers");
  }

  const signature = parseSignatureHeader(signatureHeader);
  const isValid = await verifyMercadoPagoWebhookSignature(paymentId, requestId, signature);
  if (!isValid) {
    throw new ApiError(401, "Invalid Mercado Pago webhook signature");
  }

  return {
    requestId,
    signature,
  };
}

export function extractMercadoPagoPaymentId(
  request: VercelRequest,
  payload: Record<string, unknown>,
) {
  const data = asRecord(payload.data);
  const queryId =
    asSingle(request.query.id as string | string[] | undefined) ||
    asSingle(request.query["data.id"] as string | string[] | undefined);
  const directId = asText(data?.id) || asText(payload.id) || asText(queryId);

  if (directId) {
    return directId;
  }

  const resource = asText(payload.resource);
  const match = resource?.match(/\/payments\/(\d+)/);
  return match?.[1] ?? null;
}

export async function processMercadoPagoWebhook(
  request: VercelRequest,
  payload: Record<string, unknown>,
) {
  const mercadoPagoPaymentId = extractMercadoPagoPaymentId(request, payload);
  if (!mercadoPagoPaymentId) {
    return {
      received: true,
      ignored: true,
      message: "Webhook received without a Mercado Pago payment id.",
    };
  }

  const { requestId } = await assertMercadoPagoWebhookSignature(request, mercadoPagoPaymentId);
  const tenantId = asSingle(request.query.tenantId as string | string[] | undefined);
  const internalPaymentId = asSingle(request.query.paymentId as string | string[] | undefined);
  if (!tenantId || !internalPaymentId) {
    return {
      received: true,
      ignored: true,
      paymentId: mercadoPagoPaymentId,
      message: "Webhook received without tenantId/paymentId query params.",
    };
  }

  const topic = asText(payload.type) || asText(payload.topic);
  const action = asText(payload.action);
  const dedupeKey = [
    "mp",
    tenantId,
    internalPaymentId,
    mercadoPagoPaymentId,
    requestId,
    topic || "payment",
  ].join(":");

  const receipt = await registerTenantWebhookReceipt({
    tenantId,
    paymentId: internalPaymentId,
    resourceId: mercadoPagoPaymentId,
    topic,
    action,
    dedupeKey,
    signatureValid: true,
    payloadJson: payload,
  });

  if (!receipt) {
    return {
      received: true,
      duplicate: true,
      paymentId: mercadoPagoPaymentId,
      internalPaymentId,
    };
  }

  const mercadoPagoPayment = await fetchMercadoPagoPaymentDetails(tenantId, mercadoPagoPaymentId);
  const externalReference = parseExternalReference(asText(mercadoPagoPayment.external_reference));
  if (
    externalReference &&
    (externalReference.tenantId !== tenantId || externalReference.paymentId !== internalPaymentId)
  ) {
    throw new ApiError(409, "Webhook tenant/payment mismatch.");
  }

  const payment = await syncTenantMercadoPagoPayment({
    tenantId,
    paymentId: internalPaymentId,
    mercadoPagoPayment,
    notificationPayload: payload,
    dedupeKey,
    signatureValid: true,
    eventId: receipt.id,
    recordEvent: false,
  });

  return {
    received: true,
    paymentId: mercadoPagoPaymentId,
    internalPaymentId: payment.id,
    status: payment.status,
  };
}
