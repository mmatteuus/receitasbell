import { beforeEach, describe, expect, test, vi } from "vitest";

const recipesMock = vi.hoisted(() => ({
  getRecipeById: vi.fn(),
}));

const repoMock = vi.hoisted(() => ({
  createPaymentOrder: vi.fn(),
  findPaymentOrderByIdempotencyKey: vi.fn(),
  getPaymentOrderById: vi.fn(),
  setPaymentOrderExternalReference: vi.fn(),
}));

const mpClientMock = vi.hoisted(() => ({
  createMercadoPagoPayment: vi.fn(),
  cancelMercadoPagoPayment: vi.fn(),
  mpGetPayment: vi.fn(),
}));

const connectionsMock = vi.hoisted(() => ({
  getUsableMercadoPagoAccessToken: vi.fn(),
  markConnectionReconnectRequired: vi.fn(),
  refreshMercadoPagoConnection: vi.fn(),
  getTenantMercadoPagoConnection: vi.fn(),
}));

const settingsMock = vi.hoisted(() => ({
  getSettingsMap: vi.fn(),
  mapTypedSettings: vi.fn(),
}));

const paymentServiceMock = vi.hoisted(() => ({
  syncPayment: vi.fn(),
}));

const FakeMercadoPagoApiError = vi.hoisted(() => {
  return class FakeMercadoPagoApiError extends Error {
    status: number;
    constructor(status: number, message = "Mercado Pago error") {
      super(message);
      this.status = status;
    }
  };
});

vi.mock("../src/server/recipes/repo.js", () => recipesMock);
vi.mock("../src/server/payments/repo.js", () => repoMock);
vi.mock("../src/server/integrations/mercadopago/client.js", () => ({
  createMercadoPagoPayment: (...args: unknown[]) => mpClientMock.createMercadoPagoPayment(...args),
  cancelMercadoPagoPayment: (...args: unknown[]) => mpClientMock.cancelMercadoPagoPayment(...args),
  mpGetPayment: (...args: unknown[]) => mpClientMock.mpGetPayment(...args),
  MercadoPagoApiError: FakeMercadoPagoApiError,
}));
vi.mock("../src/server/integrations/mercadopago/connections.js", () => connectionsMock);
vi.mock("../src/server/settings/repo.js", () => settingsMock);
vi.mock("../src/server/payments/service.js", () => paymentServiceMock);

import {
  createPixPayment,
  getCheckoutPaymentConfig,
  getDirectPaymentStatus,
} from "../src/server/payments/direct.js";

describe("direct payment service", () => {
  beforeEach(() => {
    recipesMock.getRecipeById.mockReset();
    repoMock.createPaymentOrder.mockReset();
    repoMock.findPaymentOrderByIdempotencyKey.mockReset();
    repoMock.getPaymentOrderById.mockReset();
    repoMock.setPaymentOrderExternalReference.mockReset();
    mpClientMock.createMercadoPagoPayment.mockReset();
    mpClientMock.cancelMercadoPagoPayment.mockReset();
    mpClientMock.mpGetPayment.mockReset();
    connectionsMock.getUsableMercadoPagoAccessToken.mockReset();
    connectionsMock.markConnectionReconnectRequired.mockReset();
    connectionsMock.refreshMercadoPagoConnection.mockReset();
    connectionsMock.getTenantMercadoPagoConnection.mockReset();
    settingsMock.getSettingsMap.mockReset();
    settingsMock.mapTypedSettings.mockReset();
    paymentServiceMock.syncPayment.mockReset();
  });

  test("cria pagamento PIX com external_reference canonico e QR Code", async () => {
    recipesMock.getRecipeById.mockResolvedValue({
      id: "recipe-1",
      slug: "bolo-de-cenoura",
      title: "Bolo de Cenoura",
      imageUrl: "https://cdn.exemplo.com/bolo.jpg",
      priceBRL: 19.9,
    });

    repoMock.findPaymentOrderByIdempotencyKey.mockResolvedValue(null);
    repoMock.createPaymentOrder.mockResolvedValue({
      id: "order-1",
      tenantId: "tenant-1",
      userId: null,
      amount: 19.9,
      currency: "BRL",
      status: "created",
      externalReference: "checkout-1",
      mpPaymentId: "",
      preferenceId: "",
      idempotencyKey: "pix_checkout-1",
      payerEmail: "cliente@exemplo.com",
      paymentMethod: "pix",
      provider: "mercadopago",
      recipeIds: ["recipe-1"],
      items: [
        {
          recipeId: "recipe-1",
          recipeSlug: "bolo-de-cenoura",
          slug: "bolo-de-cenoura",
          title: "Bolo de Cenoura",
          imageUrl: "https://cdn.exemplo.com/bolo.jpg",
          priceBRL: 19.9,
          quantity: 1,
        },
      ],
      createdAt: "2026-03-28T12:00:00.000Z",
      updatedAt: "2026-03-28T12:00:00.000Z",
    });
    repoMock.getPaymentOrderById.mockResolvedValue({
      id: "order-1",
      tenantId: "tenant-1",
      userId: null,
      amount: 19.9,
      currency: "BRL",
      status: "pending",
      externalReference: "t:tenant-1:p:order-1",
      mpPaymentId: "mp-123",
      preferenceId: "",
      idempotencyKey: "pix_checkout-1",
      payerEmail: "cliente@exemplo.com",
      paymentMethod: "pix",
      provider: "mercadopago",
      recipeIds: ["recipe-1"],
      items: [
        {
          recipeId: "recipe-1",
          recipeSlug: "bolo-de-cenoura",
          slug: "bolo-de-cenoura",
          title: "Bolo de Cenoura",
          imageUrl: "https://cdn.exemplo.com/bolo.jpg",
          priceBRL: 19.9,
          quantity: 1,
        },
      ],
      createdAt: "2026-03-28T12:00:00.000Z",
      updatedAt: "2026-03-28T12:01:00.000Z",
    });
    connectionsMock.getUsableMercadoPagoAccessToken.mockResolvedValue({
      accessToken: "seller-token",
      connection: { id: "conn-1", tenantId: "tenant-1", status: "connected" },
    });
    mpClientMock.createMercadoPagoPayment.mockResolvedValue({
      id: "mp-123",
      status: "pending",
      external_reference: "t:tenant-1:p:order-1",
      point_of_interaction: {
        transaction_data: {
          qr_code: "000201...",
          qr_code_base64: "iVBORw0KGgo",
          ticket_url: "https://mp.test/pix-ticket",
        },
      },
    });
    paymentServiceMock.syncPayment.mockResolvedValue(undefined);

    const result = await createPixPayment("tenant-1", {
      recipeIds: ["recipe-1"],
      buyerEmail: "cliente@exemplo.com",
      payerName: "Bell Ferreira",
      checkoutReference: "checkout-1",
      identification: {
        type: "CPF",
        number: "12345678909",
      },
      baseUrl: "https://app.exemplo.com",
    });

    expect(repoMock.setPaymentOrderExternalReference).toHaveBeenCalledWith(
      "tenant-1",
      "order-1",
      "t:tenant-1:p:order-1",
    );
    expect(mpClientMock.createMercadoPagoPayment).toHaveBeenCalledWith(
      "seller-token",
      expect.objectContaining({
        transaction_amount: 19.9,
        payment_method_id: "pix",
        external_reference: "t:tenant-1:p:order-1",
        notification_url: "https://app.exemplo.com/api/checkout/webhook?paymentId=order-1&tenantId=tenant-1",
      }),
    );
    expect(paymentServiceMock.syncPayment).toHaveBeenCalledWith("tenant-1", "order-1", "pending", "mp-123");
    expect(result.paymentMethod).toBe("pix");
    expect(result.internalStatus).toBe("pending");
    expect(result.qrCode).toBe("000201...");
    expect(result.qrCodeBase64).toBe("iVBORw0KGgo");
    expect(result.qrCodeUrl).toBe("https://mp.test/pix-ticket");
  });

  test("exponibiliza cartao na config publica quando a conexao tem public key", async () => {
    settingsMock.getSettingsMap.mockResolvedValue({
      payment_mode: "sandbox",
    });
    settingsMock.mapTypedSettings.mockReturnValue({
      payment_mode: "sandbox",
    });
    connectionsMock.getTenantMercadoPagoConnection.mockResolvedValue({
      id: "conn-1",
      tenantId: "tenant-1",
      publicKey: "APP_USR-123",
      status: "connected",
    });

    const result = await getCheckoutPaymentConfig("tenant-1");

    expect(result.paymentMode).toBe("sandbox");
    expect(result.publicKey).toBe("APP_USR-123");
    expect(result.supportedMethods).toEqual(["checkout_pro", "pix", "card"]);
  });

  test("consulta status do pagamento direto e sincroniza aprovacao", async () => {
    repoMock.getPaymentOrderById
      .mockResolvedValueOnce({
        id: "order-2",
        tenantId: "tenant-1",
        userId: null,
        amount: 29.9,
        currency: "BRL",
        status: "pending",
        externalReference: "t:tenant-1:p:order-2",
        mpPaymentId: "mp-999",
        preferenceId: "",
        idempotencyKey: "card_checkout-2",
        payerEmail: "cliente@exemplo.com",
        paymentMethod: "credit_card",
        provider: "mercadopago",
        recipeIds: ["recipe-2"],
        items: [
          {
            recipeId: "recipe-2",
            recipeSlug: "torta-limao",
            slug: "torta-limao",
            title: "Torta de Limao",
            imageUrl: null,
            priceBRL: 29.9,
            quantity: 1,
          },
        ],
        createdAt: "2026-03-28T12:00:00.000Z",
        updatedAt: "2026-03-28T12:01:00.000Z",
      })
      .mockResolvedValueOnce({
        id: "order-2",
        tenantId: "tenant-1",
        userId: null,
        amount: 29.9,
        currency: "BRL",
        status: "approved",
        externalReference: "t:tenant-1:p:order-2",
        mpPaymentId: "mp-999",
        preferenceId: "",
        idempotencyKey: "card_checkout-2",
        payerEmail: "cliente@exemplo.com",
        paymentMethod: "credit_card",
        provider: "mercadopago",
        recipeIds: ["recipe-2"],
        items: [
          {
            recipeId: "recipe-2",
            recipeSlug: "torta-limao",
            slug: "torta-limao",
            title: "Torta de Limao",
            imageUrl: null,
            priceBRL: 29.9,
            quantity: 1,
          },
        ],
        createdAt: "2026-03-28T12:00:00.000Z",
        updatedAt: "2026-03-28T12:02:00.000Z",
      });
    connectionsMock.getUsableMercadoPagoAccessToken.mockResolvedValue({
      accessToken: "seller-token",
      connection: { id: "conn-1", tenantId: "tenant-1", status: "connected" },
    });
    mpClientMock.mpGetPayment.mockResolvedValue({
      id: "mp-999",
      status: "approved",
      status_detail: "accredited",
      external_reference: "t:tenant-1:p:order-2",
    });
    paymentServiceMock.syncPayment.mockResolvedValue(undefined);

    const result = await getDirectPaymentStatus("tenant-1", "order-2");

    expect(mpClientMock.mpGetPayment).toHaveBeenCalledWith("seller-token", "mp-999");
    expect(paymentServiceMock.syncPayment).toHaveBeenCalledWith("tenant-1", "order-2", "approved", "mp-999");
    expect(result.paymentMethod).toBe("card");
    expect(result.internalStatus).toBe("approved");
    expect(result.statusDetail).toBe("accredited");
  });
});
