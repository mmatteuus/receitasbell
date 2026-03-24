import { createHmac } from "node:crypto";
import { afterEach, describe, expect, test } from "vitest";
import {
  buildMercadoPagoWebhookManifest,
  verifyMercadoPagoWebhookSignature,
} from "../src/server/integrations/mercadopago/webhook.js";

describe("mercado pago webhook signature", () => {
  const previousSecret = process.env.MP_WEBHOOK_SECRET;

  afterEach(() => {
    if (previousSecret === undefined) {
      delete process.env.MP_WEBHOOK_SECRET;
    } else {
      process.env.MP_WEBHOOK_SECRET = previousSecret;
    }
  });

  test("valida manifest com ts, request-id e payment id", async () => {
    // Note: env.ts is already loaded with values from vitest.config.ts
    // We use the same secret here to match.
    const secret = "mock-webhook-secret"; 
    const manifest = buildMercadoPagoWebhookManifest("123456", "req-789", "1700000000");
    const validDigest = createHmac("sha256", secret).update(manifest).digest("hex");

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
