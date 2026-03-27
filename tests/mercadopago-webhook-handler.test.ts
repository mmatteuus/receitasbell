import { beforeEach, describe, expect, test, vi } from "vitest";
import type { VercelRequest, VercelResponse } from "@vercel/node";

// Hoisted/mutable fakes
const baserowFetch = vi.hoisted(() => vi.fn());
const getUsableMercadoPagoAccessToken = vi.hoisted(() => vi.fn());
const refreshMercadoPagoConnection = vi.hoisted(() => vi.fn());
const markConnectionReconnectRequired = vi.hoisted(() => vi.fn());
const mpGetPayment = vi.hoisted(() => vi.fn());
const getPaymentOrderById = vi.hoisted(() => vi.fn());
const syncPayment = vi.hoisted(() => vi.fn());
const logAuditEvent = vi.hoisted(() => vi.fn());
const FakeMercadoPagoApiError = vi.hoisted(() => {
  return class FakeMercadoPagoApiError extends Error {
    status: number;
    constructor(status: number, message = "Mercado Pago error") {
      super(message);
      this.status = status;
    }
  };
});

vi.mock("../src/server/integrations/mercadopago/webhookSignature.js", () => ({
  verifyWebhookSignature: vi.fn(() => true),
}));

vi.mock("../src/server/integrations/baserow/client.js", () => ({ baserowFetch }));

vi.mock("../src/server/integrations/baserow/tables.js", () => ({
  baserowTables: {
    paymentEvents: "paymentEvents",
    paymentOrders: "paymentOrders",
  },
}));

vi.mock("../src/server/integrations/mercadopago/client.js", () => ({
  mpGetPayment: (...args: unknown[]) => mpGetPayment(...args),
  MercadoPagoApiError: FakeMercadoPagoApiError,
}));

vi.mock("../src/server/audit/repo.js", () => ({
  logAuditEvent: (...args: unknown[]) => logAuditEvent(...args),
}));

vi.mock("../src/server/integrations/mercadopago/connections.js", () => ({
  getUsableMercadoPagoAccessToken: (...args: unknown[]) => getUsableMercadoPagoAccessToken(...args),
  markConnectionReconnectRequired: (...args: unknown[]) => markConnectionReconnectRequired(...args),
  refreshMercadoPagoConnection: (...args: unknown[]) => refreshMercadoPagoConnection(...args),
}));

vi.mock("../src/server/payments/repo.js", () => ({
  getPaymentOrderById: (...args: unknown[]) => getPaymentOrderById(...args),
}));

vi.mock("../src/server/payments/service.js", () => ({
  syncPayment: (...args: unknown[]) => syncPayment(...args),
}));

import handler from "../api_handlers/checkout/webhook.js";

function buildReq(overrides: Partial<VercelRequest> = {}) {
  return {
    method: "POST",
    headers: {
      "x-signature": "sig",
      "x-request-id": "req-1",
      ...(overrides.headers ?? {}),
    },
    query: {
      "data.id": "pay-123",
      ...(overrides.query ?? {}),
    },
    body: overrides.body ?? JSON.stringify({ data: { id: "pay-123" } }),
    ...overrides,
  } as unknown as VercelRequest;
}

function buildRes() {
  const state: { status?: number; body?: unknown; headers: Record<string, string> } = { headers: {} };
  const res = {
    status(code: number) {
      state.status = code;
      return this;
    },
    json(payload: unknown) {
      state.body = payload;
      return this;
    },
    setHeader(key: string, value: string) {
      state.headers[key] = value;
    },
    getHeader(key: string) {
      return state.headers[key];
    },
    _state: state,
  };
  return res as unknown as VercelResponse & { _state: typeof state };
}

describe("mercadopago webhook handler", () => {
  beforeEach(() => {
    baserowFetch.mockReset();
    getUsableMercadoPagoAccessToken.mockReset();
    refreshMercadoPagoConnection.mockReset();
    markConnectionReconnectRequired.mockReset();
    mpGetPayment.mockReset();
    getPaymentOrderById.mockReset();
    syncPayment.mockReset();
    logAuditEvent.mockReset();
  });

  test("faz retry com refresh e sincroniza pagamento quando o primeiro token falha", async () => {
    baserowFetch.mockImplementation(async (path: string) => {
      if (path.includes("paymentEvents") && path.includes("filter__")) {
        return { results: [] };
      }
      return { results: [] };
    });

    getUsableMercadoPagoAccessToken
      .mockResolvedValueOnce({
        accessToken: "old-token",
        connection: { id: "conn-old", tenantId: "tenant-1", status: "connected" },
      })
      .mockResolvedValueOnce({
        accessToken: "new-token",
        connection: { id: "conn-new", tenantId: "tenant-1", status: "connected" },
      });

    refreshMercadoPagoConnection.mockResolvedValue({ id: "conn-new", tenantId: "tenant-1", status: "connected" });

    mpGetPayment
      .mockImplementationOnce(() => {
        throw new FakeMercadoPagoApiError(401);
      })
      .mockResolvedValueOnce({
        id: "mp-999",
        status: "approved",
        external_reference: "t:tenant-1:p:order-1",
      });

    getPaymentOrderById.mockResolvedValue({ id: "order-1", tenantId: "tenant-1" });
    syncPayment.mockResolvedValue(undefined);

    const res = buildRes();
    await handler(
      buildReq({
        query: { "data.id": "pay-123", paymentId: "order-1", tenantId: "tenant-1" },
      }),
      res,
    );

    expect(refreshMercadoPagoConnection).toHaveBeenCalledWith("conn-old");
    expect(mpGetPayment).toHaveBeenCalledTimes(2);
    expect(markConnectionReconnectRequired).not.toHaveBeenCalled();
    expect(syncPayment).toHaveBeenCalledWith("tenant-1", "order-1", "approved", "pay-123");
    expect(logAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "webhook.payment_synced",
        tenantId: "tenant-1",
        resourceId: "order-1",
      }),
    );
    expect(res._state.status).toBe(200);
    expect(res._state.body?.success).toBe(true);
  });

  test("marca reconnect_required quando o token segue rejeitado apos refresh", async () => {
    baserowFetch.mockResolvedValue({ results: [] });

    getUsableMercadoPagoAccessToken
      .mockResolvedValueOnce({
        accessToken: "old-token",
        connection: { id: "conn-old", tenantId: "tenant-2", status: "connected" },
      })
      .mockResolvedValueOnce({
        accessToken: "new-token",
        connection: { id: "conn-new", tenantId: "tenant-2", status: "connected" },
      });

    refreshMercadoPagoConnection.mockResolvedValue({ id: "conn-new", tenantId: "tenant-2", status: "connected" });

    mpGetPayment
      .mockImplementationOnce(() => {
        throw new FakeMercadoPagoApiError(401);
      })
      .mockImplementationOnce(() => {
        throw new FakeMercadoPagoApiError(401);
      });

    getPaymentOrderById.mockResolvedValue({ id: "order-2", tenantId: "tenant-2" });

    const res = buildRes();
    await handler(
      buildReq({
        query: { "data.id": "pay-456", paymentId: "order-2", tenantId: "tenant-2" },
      }),
      res,
    );

    expect(refreshMercadoPagoConnection).toHaveBeenCalledWith("conn-old");
    expect(markConnectionReconnectRequired).toHaveBeenCalledWith({
      tenantId: "tenant-2",
      reason: "token_rejected_after_refresh",
    });
    expect(syncPayment).not.toHaveBeenCalled();
    expect(logAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "webhook.payment_sync_failed",
        tenantId: "tenant-2",
      }),
    );
    expect(res._state.status).toBe(409);
    expect(res._state.body?.success).toBe(false);
  });
});
