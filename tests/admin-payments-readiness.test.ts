import { beforeEach, describe, expect, test, vi } from "vitest";

const envMock = vi.hoisted(() => ({
  hasMercadoPagoAppConfigAsync: vi.fn(),
  hasMercadoPagoWebhookSecretAsync: vi.fn(),
  getOptionalEnv: vi.fn(),
}));

const connectionsMock = vi.hoisted(() => ({
  getTenantMercadoPagoConnection: vi.fn(),
}));

const settingsMock = vi.hoisted(() => ({
  getSettingsMap: vi.fn(),
  mapTypedSettings: vi.fn(),
}));

vi.mock("../src/server/shared/env.js", () => envMock);
vi.mock("../src/server/integrations/mercadopago/connections.js", () => connectionsMock);
vi.mock("../src/server/settings/repo.js", () => settingsMock);

import { assertPaymentSettingsPatchAllowed, evaluatePaymentReadiness } from "../src/server/admin/payments.js";

describe("admin payments readiness", () => {
  beforeEach(() => {
    envMock.hasMercadoPagoAppConfigAsync.mockReset();
    envMock.hasMercadoPagoWebhookSecretAsync.mockReset();
    envMock.getOptionalEnv.mockReset();
    connectionsMock.getTenantMercadoPagoConnection.mockReset();
    settingsMock.getSettingsMap.mockReset();
    settingsMock.mapTypedSettings.mockReset();
  });

  test("sandbox nao expõe bloqueios de produção", () => {
    const result = evaluatePaymentReadiness({
      paymentMode: "sandbox",
      webhooksEnabled: false,
      paymentTopicEnabled: false,
      oauthConfigured: false,
      webhookSecretConfigured: false,
      connectionStatus: "disconnected",
    });
    expect(result.productionReady).toBe(false);
    expect(result.blockingReasons).toEqual([]);
    expect(result.effectiveCheckoutUrlKind).toBe("sandbox_init_point");
  });

  test("bloqueia ativacao de production quando precondicoes nao estao prontas", async () => {
    settingsMock.getSettingsMap.mockResolvedValue({});
    settingsMock.mapTypedSettings.mockReturnValue({
      payment_mode: "sandbox",
      webhooks_enabled: true,
      payment_topic_enabled: true,
    });
    envMock.hasMercadoPagoAppConfigAsync.mockResolvedValue(false);
    envMock.hasMercadoPagoWebhookSecretAsync.mockResolvedValue(false);
    connectionsMock.getTenantMercadoPagoConnection.mockResolvedValue({
      status: "disconnected",
    });

    await expect(
      assertPaymentSettingsPatchAllowed("tenant-a", { payment_mode: "production" }),
    ).rejects.toMatchObject({
      status: 409,
      details: {
        blockingReasons: expect.arrayContaining([
          "oauth_app_not_configured",
          "webhook_secret_not_configured",
          "mercadopago_connection_not_connected",
        ]),
      },
    });
  });

  test("ignora validacao de prontidao para patch sem chaves de pagamento", async () => {
    const result = await assertPaymentSettingsPatchAllowed("tenant-a", { siteName: "Receitas Bell" });
    expect(result).toBeNull();
  });
});
