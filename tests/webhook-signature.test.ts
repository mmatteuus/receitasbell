import { createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import {
  buildMercadoPagoWebhookManifest,
  verifyWebhookSignature,
  verifyMercadoPagoWebhookSignature,
} from "../src/server/integrations/mercadopago/webhookSignature.js";

describe("mercado pago webhook signature", () => {
  const previousMpWebhookSecret = process.env.MP_WEBHOOK_SECRET;
  const previousMercadoPagoWebhookSecret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;

  beforeEach(() => {
    process.env.MP_WEBHOOK_SECRET = "mock-webhook-secret";
    delete process.env.MERCADO_PAGO_WEBHOOK_SECRET;
  });

  afterEach(() => {
    if (previousMpWebhookSecret === undefined) {
      delete process.env.MP_WEBHOOK_SECRET;
    } else {
      process.env.MP_WEBHOOK_SECRET = previousMpWebhookSecret;
    }

    if (previousMercadoPagoWebhookSecret === undefined) {
      delete process.env.MERCADO_PAGO_WEBHOOK_SECRET;
    } else {
      process.env.MERCADO_PAGO_WEBHOOK_SECRET = previousMercadoPagoWebhookSecret;
    }
  });

  test("valida manifest com ts, request-id e payment id", async () => {
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
