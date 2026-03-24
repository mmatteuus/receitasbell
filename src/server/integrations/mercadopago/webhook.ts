import type { VercelRequest } from "@vercel/node";
import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "../../shared/env.js";
import { ApiError } from "../../shared/http.js";
import { fetchMercadoPagoPayment } from "./client.js";
import { syncPayment } from "../../payments/service.js";
import { createPaymentEvent } from "../../payments/repo.js";

type MercadoPagoSignatureParts = {
  ts: string;
  v1: string;
};

function parseSignatureHeader(header: string) {
  const parts = header.split(",").reduce<Record<string, string>>((acc, part) => {
    const [rawKey, ...rawValue] = part.split("=");
    if (rawKey) acc[rawKey.trim()] = rawValue.join("=").trim();
    return acc;
  }, {});

  const ts = parts.ts;
  const v1 = parts.v1;
  if (!ts || !v1) throw new ApiError(400, "Malformed Mercado Pago signature header");
  return { ts, v1 } satisfies MercadoPagoSignatureParts;
}

function signaturesMatch(expected: string, received: string) {
  try { return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(received, "hex")); } catch { return false; }
}

export function buildMercadoPagoWebhookManifest(paymentId: string, requestId: string, ts: string) {
  return `id:${paymentId};request-id:${requestId};ts:${ts};`;
}

export async function verifyMercadoPagoWebhookSignature(paymentId: string, requestId: string, signature: MercadoPagoSignatureParts) {
  const webhookSecret = env.MP_WEBHOOK_SECRET;
  const manifest = buildMercadoPagoWebhookManifest(paymentId, requestId, signature.ts);
  const digest = createHmac("sha256", webhookSecret).update(manifest).digest("hex");
  return signaturesMatch(digest, signature.v1.toLowerCase());
}

export async function assertMercadoPagoWebhookSignature(request: VercelRequest, paymentId: string) {
  const signatureHeader = request.headers["x-signature"];
  const requestId = request.headers["x-request-id"];
  const sigStr = Array.isArray(signatureHeader) ? signatureHeader[0] : signatureHeader;
  const reqIdStr = Array.isArray(requestId) ? requestId[0] : requestId;

  if (!sigStr || !reqIdStr) throw new ApiError(401, "Missing Mercado Pago webhook signature headers");

  const signature = parseSignatureHeader(sigStr);
  if (!await verifyMercadoPagoWebhookSignature(paymentId, reqIdStr, signature)) throw new ApiError(401, "Invalid Mercado Pago webhook signature");

  return { requestId: reqIdStr, signature };
}

export async function processMercadoPagoWebhook(
  tenantId: string | number, 
  payload: { topic?: string; type?: string; resource?: string; data?: { id?: string }; [key: string]: any },
  signatureValid: boolean = false
) {
  const topic = payload.topic || payload.type;
  const resourceId = payload.resource || payload.data?.id;

  if (topic === 'payment' && resourceId) {
    const mpPayment = await fetchMercadoPagoPayment(tenantId, String(resourceId));
    const externalRef = mpPayment.external_reference as string;
    
    // Format: t:tenantId:p:paymentOrderId
    if (externalRef && externalRef.startsWith('t:')) {
      const parts = externalRef.split(':');
      const paymentOrderId = parts[parts.length - 1];
      
      if (paymentOrderId) {
        await syncPayment(tenantId, paymentOrderId, mpPayment.status as string, String(resourceId));
      }
    }
    
    const dedupeKey = `mp_evt_${resourceId}_${payload.action || 'sync'}`;
    await createPaymentEvent(tenantId, {
      paymentId: String(resourceId),
      topic,
      resourceId: String(resourceId),
      action: payload.action,
      payloadJson: payload,
      signatureValid,
      dedupeKey,
    });
  }
}
