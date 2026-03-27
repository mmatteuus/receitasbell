import { createHmac, timingSafeEqual } from "node:crypto";
import { env, getOptionalEnv } from "../../shared/env.js";

export function buildMercadoPagoWebhookManifest(
  paymentId: string,
  requestId: string,
  ts: string,
): string {
  return `ts:${ts};x-request-id:${requestId};x-payment-id:${paymentId}`;
}

/**
 * Valida a assinatura x-signature do webhook do Mercado Pago.
 *
 * Documentação oficial:
 * https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks
 *
 * Formato do header x-signature: "ts=<timestamp>;v1=<hmac_hex>"
 * Formato da mensagem assinada: "ts:<ts>;x-request-id:<requestId>;x-payment-id:<paymentId>"
 */
export function verifyMpWebhookSignature({
  secret,
  ts,
  requestId,
  paymentId,
  v1,
}: {
  secret: string;
  ts: string;
  requestId: string;
  paymentId: string;
  v1: string;
}): boolean {
  const manifest = buildMercadoPagoWebhookManifest(paymentId, requestId, ts);
  const expected = createHmac("sha256", secret).update(manifest, "utf8").digest("hex");

  const receivedBuf = Buffer.from(v1, "utf8");
  const expectedBuf = Buffer.from(expected, "utf8");

  if (receivedBuf.length !== expectedBuf.length) return false;
  return timingSafeEqual(receivedBuf, expectedBuf);
}

/**
 * Parseia o header x-signature do Mercado Pago.
 * Retorna null se o formato for inválido.
 *
 * Exemplo de header: "ts=1698765432;v1=abc123def456..."
 */
export function parseMpXSignature(header: string | null | undefined): {
  ts: string;
  v1: string;
} | null {
  if (!header) return null;
  const tsMatch = header.match(/ts=([^;,\s]+)/);
  const v1Match = header.match(/v1=([^;,\s]+)/);
  if (!tsMatch || !v1Match) return null;
  return { ts: tsMatch[1], v1: v1Match[1] };
}

export function verifyMercadoPagoWebhookSignature(
  resourceId: string,
  requestId: string,
  signatureHeader: {
    ts: string;
    v1: string;
  },
): boolean {
  const secret =
    getOptionalEnv("MERCADO_PAGO_WEBHOOK_SECRET", ["MP_WEBHOOK_SECRET"])
    || env.MERCADO_PAGO_WEBHOOK_SECRET
    || env.MP_WEBHOOK_SECRET
    || "";
  if (!secret || secret === "UNSPECIFIED") {
    // Se não configurado, permitimos apenas em desenvolvimento.
    return env.NODE_ENV !== "production";
  }

  return verifyMpWebhookSignature({
    secret,
    ts: signatureHeader.ts,
    requestId,
    paymentId: resourceId,
    v1: signatureHeader.v1,
  });
}

export function verifyWebhookSignature(input: {
  dataIdUrl: string;
  xRequestId: string;
  xSignature: string;
}) {
  const signature = parseMpXSignature(input.xSignature);
  if (!signature) return false;
  return verifyMercadoPagoWebhookSignature(input.dataIdUrl, input.xRequestId, signature);
}
