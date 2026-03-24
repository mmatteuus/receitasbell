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

vi.mock("../src/server/shared/http.js", () => ({
  getPrisma: () => prismaMock,
}));
vi.mock("../src/server/integrations/mercadopago/connections.js", () => connectionsMock);
vi.mock("../src/server/recipes/repo.js", () => recipesMock);
vi.mock("../src/server/identity/entitlements.repo.js", () => entitlementsMock);
vi.mock("../src/server/payments/repo.js", () => ({
  createPayment: prismaMock.payment.create,
  getPaymentById: prismaMock.payment.findUnique,
  updatePaymentStatus: prismaMock.payment.update,
  PaymentStatus: {} as any
}));

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
    recipesMock.getRecipeById.mockReset();
    entitlementsMock.createEntitlement.mockReset();
    entitlementsMock.listEntitlementsByEmail.mockReset();
    entitlementsMock.revokeEntitlement.mockReset();
    vi.restoreAllMocks();
  });

  test("cria checkout usando token do seller do tenant correto", async () => {
    prismaMock.payment.findUnique.mockResolvedValue(null);
    prismaMock.payment.create.mockResolvedValue({
      id: "pay-1",
      tenantId: "tenant-1",
      mercadoPagoConnectionId: "conn-1",
      externalReference: "pending",
      idempotencyKey: "tenant-1:checkout-1",
      checkoutReference: "checkout-1",
      buyerEmail: "cliente@exemplo.com",
      payerName: "Cliente",
      amount: 19.9,
      gateway: "mercado_pago",
      status: "pending",
      statusDetail: "waiting_checkout",
      paymentMethod: "pending",
      paymentType: "pending",
      preferenceId: null,
      mercadoPagoPaymentId: null,
      checkoutUrl: null,
      recipeIdsJson: ["recipe-1"],
      itemSnapshotsJson: null,
      rawLastPayloadJson: null,
      approvedAt: null,
      webhookReceivedAt: null,
      createdAt: new Date("2026-03-20T12:00:00.000Z"),
      updatedAt: new Date("2026-03-20T12:00:00.000Z"),
    });
    prismaMock.payment.update.mockResolvedValue({
      id: "pay-1",
      tenantId: "tenant-1",
      mercadoPagoConnectionId: "conn-1",
      externalReference: "t:tenant-1:p:pay-1",
      idempotencyKey: "tenant-1:checkout-1",
      checkoutReference: "checkout-1",
      buyerEmail: "cliente@exemplo.com",
      payerName: "Cliente",
      amount: 19.9,
      gateway: "mercado_pago",
      status: "pending",
      statusDetail: "waiting_checkout",
      paymentMethod: "pending",
      paymentType: "pending",
      preferenceId: "pref-123",
      mercadoPagoPaymentId: null,
      checkoutUrl: "https://mp.com/init-point",
      recipeIdsJson: ["recipe-1"],
      itemSnapshotsJson: [
        {
          recipeId: "recipe-1",
          title: "Bolo de Cenoura",
          slug: "bolo-cenoura",
          priceBRL: 19.9,
          imageUrl: "https://cdn.exemplo.com/bolo.jpg",
        },
      ],
      rawLastPayloadJson: null,
      approvedAt: null,
      webhookReceivedAt: null,
      createdAt: new Date("2026-03-20T12:00:00.000Z"),
      updatedAt: new Date("2026-03-20T12:00:02.000Z"),
    });
    prismaMock.paymentEvent.create.mockResolvedValue({ id: "event-1" });
    connectionsMock.getUsableMercadoPagoAccessToken.mockResolvedValue({
      connection: { id: "conn-1" },
      accessToken: "seller-token-tenant-1",
    });
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

    const result = await createTenantMercadoPagoCheckout("tenant-1", {
      recipeIds: ["recipe-1"],
      buyerEmail: "cliente@exemplo.com",
      checkoutReference: "checkout-1",
      baseUrl: "https://app.exemplo.com",
      enableNotifications: true,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [requestUrl, requestInit] = fetchMock.mock.calls[0]!;
    expect(requestUrl).toBe("https://api.mercadopago.com/checkout/preferences");
    const headers = (requestInit as RequestInit).headers as any;
    expect(headers.get("Authorization")).toBe("Bearer seller-token-tenant-1");

    const payload = JSON.parse(String((requestInit as RequestInit).body));
    expect(payload.external_reference).toBe("t:tenant-1:p:pay-1");
    expect(payload.notification_url).toBe(
      "https://app.exemplo.com/api/checkout/webhook?tenantId=tenant-1&paymentId=pay-1",
    );
    expect(payload.back_urls.success).toContain("/checkout/success");
    expect(result.preferenceId).toBe("pref-123");
    expect(result.gateway).toBe("mercado_pago");
  });
});
