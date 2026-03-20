import { hasMercadoPagoAppConfig, hasMercadoPagoWebhookSecret, getOptionalEnv } from "../env.js";
import { getAppBaseUrl } from "../http.js";
import { getTenantMercadoPagoConnection } from "../mercadopago/connections.js";
import { getSettingsMap, mapTypedSettings } from "../sheets/settingsRepo.js";

export async function getTenantAdminPaymentSettings(request: VercelRequest, tenantId: string) {
  const [settings, connection] = await Promise.all([
    getSettingsMap().then(mapTypedSettings),
    getTenantMercadoPagoConnection(tenantId),
  ]);

  const missingConfig: string[] = [];
  if (!getOptionalEnv("MERCADO_PAGO_CLIENT_ID", ["MP_CLIENT_ID"])) missingConfig.push("MERCADO_PAGO_CLIENT_ID");
  if (!getOptionalEnv("MERCADO_PAGO_CLIENT_SECRET", ["MP_CLIENT_SECRET"])) missingConfig.push("MERCADO_PAGO_CLIENT_SECRET");
  if (!getOptionalEnv("APP_BASE_URL")) missingConfig.push("APP_BASE_URL");
  if (!getOptionalEnv("MERCADO_PAGO_WEBHOOK_SECRET", ["MP_WEBHOOK_SECRET"])) missingConfig.push("MERCADO_PAGO_WEBHOOK_SECRET");

  return {
    payment_mode: settings.payment_mode,
    webhooks_enabled: settings.webhooks_enabled,
    payment_topic_enabled: settings.payment_topic_enabled,
    accessTokenConfigured: Boolean(connection?.accessTokenEncrypted),
    oauthConfigured: hasMercadoPagoAppConfig(),
    webhookSecretConfigured: hasMercadoPagoWebhookSecret(),
    missingConfig,
    userId: connection?.mercadoPagoUserId ?? null,
    publicKey: connection?.publicKey ?? null,
    webhookUrl: `${getAppBaseUrl(request).replace(/\/+$/, "")}/api/payments/mercadopago/webhook`,
    connectionStatus: connection?.status ?? "disconnected",
    connectedAt: connection?.connectedAt?.toISOString() ?? null,
    disconnectedAt: connection?.disconnectedAt?.toISOString() ?? null,
    lastError: connection?.lastError ?? null,
    tenantId,
  };
}
