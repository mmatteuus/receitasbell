import { beforeEach, describe, expect, test, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  payment: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  paymentEvent: {
    create: vi.fn(),
  },
}));

const connectionsMock = vi.hoisted(() => ({
  getUsableMercadoPagoAccessToken: vi.fn(),
  markConnectionReconnectRequired: vi.fn(),
  refreshMercadoPagoConnection: vi.fn(),
}));

const recipesMock = vi.hoisted(() => ({
  getRecipeById: vi.fn(),
}));

const entitlementsMock = vi.hoisted(() => ({
  createEntitlement: vi.fn(),
  listEntitlementsByEmail: vi.fn(),
  revokeEntitlement: vi.fn(),
}));

const settingsMock = vi.hoisted(() => ({
  getSettingsMap: vi.fn(),
  mapTypedSettings: vi.fn(),
}));

const auditMock = vi.hoisted(() => ({
  logAuditEvent: vi.fn(),
}));

vi.mock("../src/server/shared/http.js", () => ({
  ApiError: class ApiError extends Error {
    status: number;
    constructor(status: number, message: string) {
      super(message);
      this.status = status;
    }
  },
  getPrisma: () => prismaMock,
}));
vi.mock("../src/server/integrations/mercadopago/connections.js", () => connectionsMock);
vi.mock("../src/server/recipes/repo.js", () => recipesMock);
vi.mock("../src/server/identity/entitlements.repo.js", () => entitlementsMock);
vi.mock("../src/server/settings/repo.js", () => settingsMock);
vi.mock("../src/server/audit/repo.js", () => auditMock);
vi.mock("../src/server/payments/repo.js", () => ({
  createPaymentOrder: vi.fn(),
  getPaymentOrderById: vi.fn(),
  setPaymentOrderExternalReference: vi.fn(),
  updatePaymentOrderStatus: vi.fn(),
  PaymentStatus: {} as Record<string, unknown>
}));

// Acesso direto aos mocks para facilitar as asserções
import * as paymentRepo from "../src/server/payments/repo.js";
const repoMock = paymentRepo as typeof paymentRepo;

import { createCheckout as createTenantMercadoPagoCheckout } from "../src/server/payments/service.js";

describe("mercado pago payment service", () => {
  beforeEach(() => {
    prismaMock.payment.findUnique.mockReset();
    prismaMock.payment.create.mockReset();
    prismaMock.payment.update.mockReset();
    prismaMock.paymentEvent.create.mockReset();
    connectionsMock.getUsableMercadoPagoAccessToken.mockReset();
    connectionsMock.markConnectionReconnectRequired.mockReset();
    connectionsMock.refreshMercadoPagoConnection.mockReset();
    repoMock.setPaymentOrderExternalReference?.mockReset?.();
    recipesMock.getRecipeById.mockReset();
    settingsMock.getSettingsMap.mockReset();
    settingsMock.mapTypedSettings.mockReset();
    entitlementsMock.createEntitlement.mockReset();
    entitlementsMock.listEntitlementsByEmail.mockReset();
    entitlementsMock.revokeEntitlement.mockReset();
    auditMock.logAuditEvent.mockReset();
    vi.restoreAllMocks();
  });

  test("cria checkout usando token do seller do tenant correto", async () => {
    repoMock.createPaymentOrder.mockResolvedValue({
      id: "pay-1",
      tenantId: "tenant-1",
      amount: 19.9,
      status: "created",
      externalReference: "checkout-1",
      idempotencyKey: "chk_checkout-1",
      payerEmail: "cliente@exemplo.com",
      paymentMethod: "mercadopago",
      recipeIds: ["recipe-1"],
      items: [
        { recipeId: "recipe-1", title: "Bolo de Cenoura", priceBRL: 19.9 }
      ],
      createdAt: "2026-03-24T12:00:00.000Z",
      updatedAt: "2026-03-24T12:00:00.000Z",
    });

    repoMock.updatePaymentOrderStatus.mockResolvedValue(undefined);
    repoMock.setPaymentOrderExternalReference.mockResolvedValue(undefined);

    recipesMock.getRecipeById.mockResolvedValue({
      id: "recipe-1",
      title: "Bolo de Cenoura",
      slug: "bolo-cenoura",
      priceBRL: 19.9,
      imageUrl: "https://cdn.exemplo.com/bolo.jpg",
      accessTier: "paid",
    });

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({
        id: "pref-123",
        init_point: "https://mp.com/init-point",
        sandbox_init_point: "https://mp.com/sandbox-init-point",
      }),
    });
    vi.stubGlobal("fetch", fetchMock);
    settingsMock.getSettingsMap.mockResolvedValue({
      payment_mode: "sandbox",
      webhooks_enabled: "true",
      payment_topic_enabled: "true",
    });
    settingsMock.mapTypedSettings.mockReturnValue({
      payment_mode: "sandbox",
      webhooks_enabled: true,
      payment_topic_enabled: true,
    });
    connectionsMock.getUsableMercadoPagoAccessToken.mockResolvedValue({
      accessToken: "seller-token-tenant-1",
      connection: { id: "conn-1", tenantId: "tenant-1", status: "connected" },
    });

    const result = await createTenantMercadoPagoCheckout("tenant-1", {
      recipeIds: ["recipe-1"],
      buyerEmail: "cliente@exemplo.com",
      checkoutReference: "checkout-1",
      baseUrl: "https://app.exemplo.com",
      enableNotifications: true,
    });

    expect(repoMock.createPaymentOrder).toHaveBeenCalledTimes(1);
    expect(repoMock.setPaymentOrderExternalReference).toHaveBeenCalledWith(
      "tenant-1",
      "pay-1",
      "t:tenant-1:p:pay-1",
    );
    expect(repoMock.updatePaymentOrderStatus).toHaveBeenCalledWith("tenant-1", "pay-1", "pending", undefined);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    
    const [requestUrl, requestInit] = fetchMock.mock.calls[0]!;
    expect(requestUrl).toBe("https://api.mercadopago.com/checkout/preferences");
    const headers = requestInit?.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer seller-token-tenant-1");
    
    const payload = JSON.parse(String((requestInit as RequestInit).body));
    expect(payload.external_reference).toBe("t:tenant-1:p:pay-1");
    expect(result.preferenceId).toBe("pref-123");
    expect(result.checkoutUrl).toBe("https://mp.com/sandbox-init-point");
    expect(result.checkoutUrlKind).toBe("sandbox_init_point");
    expect(result.paymentMode).toBe("sandbox");
    expect(auditMock.logAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "checkout.preference_created",
        tenantId: "tenant-1",
        resourceId: "pay-1",
      }),
    );
  });

  test("faz refresh forçado e retry único quando o token é rejeitado", async () => {
    repoMock.createPaymentOrder.mockResolvedValue({
      id: "pay-2",
      tenantId: "tenant-1",
      amount: 39.9,
      status: "created",
      externalReference: "checkout-2",
      idempotencyKey: "chk_checkout-2",
      payerEmail: "cliente@exemplo.com",
      paymentMethod: "mercadopago",
      recipeIds: ["recipe-1"],
      items: [{ recipeId: "recipe-1", title: "Torta", priceBRL: 39.9 }],
      createdAt: "2026-03-24T12:00:00.000Z",
      updatedAt: "2026-03-24T12:00:00.000Z",
    });
    repoMock.updatePaymentOrderStatus.mockResolvedValue(undefined);
    repoMock.setPaymentOrderExternalReference.mockResolvedValue(undefined);
    recipesMock.getRecipeById.mockResolvedValue({
      id: "recipe-1",
      title: "Torta",
      slug: "torta",
      priceBRL: 39.9,
    });
    settingsMock.getSettingsMap.mockResolvedValue({
      payment_mode: "production",
      webhooks_enabled: "true",
      payment_topic_enabled: "true",
    });
    settingsMock.mapTypedSettings.mockReturnValue({
      payment_mode: "production",
      webhooks_enabled: true,
      payment_topic_enabled: true,
    });

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: "unauthorized" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({
          id: "pref-456",
          init_point: "https://mp.com/prod-init",
          sandbox_init_point: "https://mp.com/sandbox-init",
        }),
      });
    vi.stubGlobal("fetch", fetchMock);
    connectionsMock.getUsableMercadoPagoAccessToken
      .mockResolvedValueOnce({
        accessToken: "old-token",
        connection: { id: "conn-old", tenantId: "tenant-1", status: "connected" },
      })
      .mockResolvedValueOnce({
        accessToken: "new-token",
        connection: { id: "conn-new", tenantId: "tenant-1", status: "connected" },
      });
    connectionsMock.refreshMercadoPagoConnection.mockResolvedValue({
      id: "conn-new",
      tenantId: "tenant-1",
      status: "connected",
    });

    const result = await createTenantMercadoPagoCheckout("tenant-1", {
      recipeIds: ["recipe-1"],
      buyerEmail: "cliente@exemplo.com",
      checkoutReference: "checkout-2",
      baseUrl: "https://app.exemplo.com",
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(connectionsMock.refreshMercadoPagoConnection).toHaveBeenCalledWith("conn-old");
    expect(connectionsMock.markConnectionReconnectRequired).not.toHaveBeenCalled();
    expect(result.checkoutUrlKind).toBe("init_point");
    expect(result.checkoutUrl).toBe("https://mp.com/prod-init");
    expect(result.paymentMode).toBe("production");
  });

  test("bloqueia checkout quando payment_mode sandbox nao recebe sandbox_init_point", async () => {
    repoMock.createPaymentOrder.mockResolvedValue({
      id: "pay-3",
      tenantId: "tenant-1",
      amount: 15.5,
      status: "created",
      externalReference: "checkout-3",
      idempotencyKey: "chk_checkout-3",
      payerEmail: "cliente@exemplo.com",
      paymentMethod: "mercadopago",
      recipeIds: ["recipe-1"],
      items: [{ recipeId: "recipe-1", title: "Cookie", priceBRL: 15.5 }],
      createdAt: "2026-03-24T12:00:00.000Z",
      updatedAt: "2026-03-24T12:00:00.000Z",
    });
    repoMock.updatePaymentOrderStatus.mockResolvedValue(undefined);
    repoMock.setPaymentOrderExternalReference.mockResolvedValue(undefined);
    recipesMock.getRecipeById.mockResolvedValue({
      id: "recipe-1",
      title: "Cookie",
      slug: "cookie",
      priceBRL: 15.5,
    });
    settingsMock.getSettingsMap.mockResolvedValue({
      payment_mode: "sandbox",
      webhooks_enabled: "true",
      payment_topic_enabled: "true",
    });
    settingsMock.mapTypedSettings.mockReturnValue({
      payment_mode: "sandbox",
      webhooks_enabled: true,
      payment_topic_enabled: true,
    });
    connectionsMock.getUsableMercadoPagoAccessToken.mockResolvedValue({
      accessToken: "seller-token-tenant-1",
      connection: { id: "conn-1", tenantId: "tenant-1", status: "connected" },
    });

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({
        id: "pref-789",
        init_point: "https://mp.com/prod-only",
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      createTenantMercadoPagoCheckout("tenant-1", {
        recipeIds: ["recipe-1"],
        buyerEmail: "cliente@exemplo.com",
        checkoutReference: "checkout-3",
        baseUrl: "https://app.exemplo.com",
      }),
    ).rejects.toMatchObject({
      status: 409,
      message: expect.stringContaining("sandbox"),
    });

    expect(repoMock.updatePaymentOrderStatus).not.toHaveBeenCalled();
    expect(auditMock.logAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "checkout.preference_failed",
        tenantId: "tenant-1",
        resourceId: "pay-3",
      }),
    );
  });
});
