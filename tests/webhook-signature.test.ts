import { createHmac } from "node:crypto";
import { afterEach, describe, expect, test } from "vitest";
import {
  buildMercadoPagoWebhookManifest,
  verifyMercadoPagoWebhookSignature,
} from "../src/server/mercadopago/webhooks.js";

describe("mercado pago webhook signature", () => {
  const previousSecret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;

  afterEach(() => {
    if (previousSecret === undefined) {
      delete process.env.MERCADO_PAGO_WEBHOOK_SECRET;
    } else {
      process.env.MERCADO_PAGO_WEBHOOK_SECRET = previousSecret;
    }
  });

  test("valida manifest com ts, request-id e payment id", async () => {
    process.env.MERCADO_PAGO_WEBHOOK_SECRET = "test-secret";
    const manifest = buildMercadoPagoWebhookManifest("123456", "req-789", "1700000000");
    const validDigest = createHmac("sha256", "test-secret").update(manifest).digest("hex");

    await expect(
      verifyMercadoPagoWebhookSignature("123456", "req-789", {
        ts: "1700000000",
        v1: validDigest,
      }),
    ).resolves.toBe(true);

    await expect(
      verifyMercadoPagoWebhookSignature("123456", "req-789", {
        ts: "1700000000",
        v1: "deadbeef",
      }),
    ).resolves.toBe(false);
  });
});
