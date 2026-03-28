import { beforeEach, describe, expect, test, vi } from "vitest";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { env } from "../src/server/shared/env.js";

const baserowFetch = vi.hoisted(() => vi.fn());
const getUsableMercadoPagoAccessToken = vi.hoisted(() => vi.fn());
const refreshMercadoPagoConnection = vi.hoisted(() => vi.fn());
const markConnectionReconnectRequired = vi.hoisted(() => vi.fn());
const mpSearchPaymentsByExternalReference = vi.hoisted(() => vi.fn());
const setPaymentOrderExternalReference = vi.hoisted(() => vi.fn());
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

vi.mock("../src/server/integrations/baserow/client.js", () => ({ baserowFetch }));

vi.mock("../src/server/integrations/baserow/tables.js", () => ({
  baserowTables: {
    paymentOrders: "paymentOrders",
  },
}));

vi.mock("../src/server/integrations/mercadopago/client.js", () => ({
  mpSearchPaymentsByExternalReference: (...args: unknown[]) =>
    mpSearchPaymentsByExternalReference(...args),
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
  setPaymentOrderExternalReference: (...args: unknown[]) => setPaymentOrderExternalReference(...args),
}));

vi.mock("../src/server/payments/service.js", () => ({
  syncPayment: (...args: unknown[]) => syncPayment(...args),
}));

import handler from "../api/jobs/[...path]";

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

function buildReq() {
  return {
    method: "GET",
    headers: { authorization: "Bearer test-cron-secret" },
    query: { path: ["reconcile"] },
    body: null,
  } as unknown as VercelRequest;
}

describe("mercadopago reconcile handler", () => {
  beforeEach(() => {
    env.CRON_SECRET = "test-cron-secret";
    baserowFetch.mockReset();
    getUsableMercadoPagoAccessToken.mockReset();
    refreshMercadoPagoConnection.mockReset();
    markConnectionReconnectRequired.mockReset();
    mpSearchPaymentsByExternalReference.mockReset();
    setPaymentOrderExternalReference.mockReset();
    syncPayment.mockReset();
    logAuditEvent.mockReset();
  });

  test("usa token por tenant, faz refresh e sincroniza quando encontra pagamentos", async () => {
    baserowFetch.mockResolvedValue({
      results: [
        { id: "order-a", tenant_id: "tenant-a", status: "pending", external_reference: "t:tenant-a:p:order-a" },
        { id: "order-b", tenant_id: "tenant-b", status: "pending", external_reference: "t:tenant-b:p:order-b" },
      ],
      next: null,
    });

    getUsableMercadoPagoAccessToken
      .mockResolvedValueOnce({ accessToken: "token-a", connection: { id: "conn-a" } })
      .mockResolvedValueOnce({ accessToken: "old-b", connection: { id: "conn-b-old" } })
      .mockResolvedValueOnce({ accessToken: "new-b", connection: { id: "conn-b-new" } });

    refreshMercadoPagoConnection.mockResolvedValue({ id: "conn-b-new", tenantId: "tenant-b" });

    mpSearchPaymentsByExternalReference
      .mockResolvedValueOnce({ results: [{ id: "mp-a", status: "approved" }] })
      .mockImplementationOnce(() => {
        throw new FakeMercadoPagoApiError(401);
      })
      .mockResolvedValueOnce({ results: [{ id: "mp-b", status: "approved" }] });

    const res = buildRes();
    await handler(buildReq(), res);

    expect(refreshMercadoPagoConnection).toHaveBeenCalledWith("conn-b-old");
    expect(markConnectionReconnectRequired).not.toHaveBeenCalled();
    expect(syncPayment).toHaveBeenCalledTimes(2);
    expect(syncPayment).toHaveBeenCalledWith("tenant-a", "order-a", "approved", "mp-a");
    expect(syncPayment).toHaveBeenCalledWith("tenant-b", "order-b", "approved", "mp-b");
    expect(logAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "webhook.payment_synced",
        tenantId: "tenant-b",
        resourceId: "order-b",
      }),
    );
    expect(res._state.status).toBe(200);
    expect(res._state.body?.data?.updated).toBe(2);
  });

  test("marca reconnect_required quando mesmo apos refresh o token segue rejeitado", async () => {
    baserowFetch.mockResolvedValue({
      results: [
        { id: "order-c", tenant_id: "tenant-c", status: "pending", external_reference: "t:tenant-c:p:order-c" },
      ],
      next: null,
    });

    getUsableMercadoPagoAccessToken
      .mockResolvedValueOnce({ accessToken: "old-c", connection: { id: "conn-c-old" } })
      .mockResolvedValueOnce({ accessToken: "new-c", connection: { id: "conn-c-new" } });

    refreshMercadoPagoConnection.mockResolvedValue({ id: "conn-c-new", tenantId: "tenant-c" });

    mpSearchPaymentsByExternalReference
      .mockImplementationOnce(() => {
        throw new FakeMercadoPagoApiError(401);
      })
      .mockImplementationOnce(() => {
        throw new FakeMercadoPagoApiError(401);
      });

    const res = buildRes();
    await handler(buildReq(), res);

    expect(refreshMercadoPagoConnection).toHaveBeenCalledWith("conn-c-old");
    expect(markConnectionReconnectRequired).toHaveBeenCalledWith({
      tenantId: "tenant-c",
      reason: "token_rejected_after_refresh",
    });
    expect(syncPayment).not.toHaveBeenCalled();
    expect(logAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "webhook.payment_sync_failed",
        tenantId: "tenant-c",
        resourceId: "order-c",
      }),
    );
  });
});
