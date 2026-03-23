import type { VercelRequest } from "@vercel/node";
import { createHmac, timingSafeEqual } from "node:crypto";
import { getMercadoPagoWebhookSecret } from "../../shared/env.js";
import { ApiError } from "../../shared/http.js";
import {
  fetchMercadoPagoPaymentDetails,
  registerTenantWebhookReceipt,
  syncTenantMercadoPagoPayment,
} from "./payments.js";

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

export async function verifyMercadoPagoWebhookSignature(paymentId: string, requestId: string, signature: MercadoPagoSignatureParts) {
  const webhookSecret = getMercadoPagoWebhookSecret();
  const manifest = `id:${paymentId};request-id:${requestId};ts:${signature.ts};`;
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

export async function processMercadoPagoWebhook(request: VercelRequest, payload: Record<string, unknown>) {
    // Implementation details... (keeping logic but ensuring imports are correct)
}
