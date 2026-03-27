import { createHmac } from "node:crypto";
import { afterEach, describe, expect, test } from "vitest";
import {
  buildMercadoPagoWebhookManifest,
  verifyWebhookSignature,
  verifyMercadoPagoWebhookSignature,
} from "../src/server/integrations/mercadopago/webhookSignature.js";

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

    expect(
      verifyMercadoPagoWebhookSignature("123456", "req-789", {
        ts: "1700000000",
        v1: validDigest,
      }),
    ).toBe(true);

    expect(
      verifyMercadoPagoWebhookSignature("123456", "req-789", {
        ts: "1700000000",
        v1: "deadbeef",
      }),
    ).toBe(false);
  });

  test("valida helper canonico de x-signature", async () => {
    const secret = "mock-webhook-secret";
    const manifest = buildMercadoPagoWebhookManifest("abc123", "req-42", "1700000000");
    const digest = createHmac("sha256", secret).update(manifest).digest("hex");

    expect(
      verifyWebhookSignature({
        dataIdUrl: "abc123",
        xRequestId: "req-42",
        xSignature: `ts=1700000000;v1=${digest}`,
      }),
    ).toBe(true);
  });
});
