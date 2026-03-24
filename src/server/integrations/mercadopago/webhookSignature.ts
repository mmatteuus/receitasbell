import crypto from "node:crypto";
import { env } from "../../shared/env.js";

export function parseXSignature(header?: string) {
  if (!header) return null;
  const parts = header.split(",").map((p) => p.trim());
  const map: Record<string, string> = {};
  for (const p of parts) {
    const [k, v] = p.split("=");
    if (k && v) map[k.trim()] = v.trim();
  }
  if (!map.ts || !map.v1) return null;
  return { ts: map.ts, v1: map.v1 };
}

/**
 * Template MP:
 * id:[data.id_url];request-id:[x-request-id_header];ts:[ts_header];
 */
export function verifyWebhookSignature(input: { dataIdUrl: string; xRequestId: string; xSignature: string }) {
  const parsed = parseXSignature(input.xSignature);
  if (!parsed) return false;

  const manifest = `id:${input.dataIdUrl};request-id:${input.xRequestId};ts:${parsed.ts};`;
  const computed = crypto.createHmac("sha256", env.MP_WEBHOOK_SECRET).update(manifest).digest("hex");
  return computed === parsed.v1;
}
