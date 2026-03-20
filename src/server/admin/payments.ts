import type { VercelRequest } from "@vercel/node";
import { hasMercadoPagoAppConfigAsync, hasMercadoPagoWebhookSecretAsync, getOptionalEnv } from "../env.js";
import { getAppBaseUrl } from "../http.js";
import { getTenantMercadoPagoConnection } from "../mercadopago/connections.js";
import { getSettingsMap, mapTypedSettings } from "../sheets/settingsRepo.js";

export async function getTenantAdminPaymentSettings(request: VercelRequest, tenantId: string) {
  const [settings, connection, oauthConfigured, webhookSecretConfigured] = await Promise.all([
    getSettingsMap().then(mapTypedSettings),
    getTenantMercadoPagoConnection(tenantId),
    hasMercadoPagoAppConfigAsync(),
    hasMercadoPagoWebhookSecretAsync(),
  ]);

  const missingConfig: string[] = [];
  if (!getOptionalEnv("MERCADO_PAGO_CLIENT_ID", ["MP_CLIENT_ID"]) && !settings.mp_client_id) missingConfig.push("MERCADO_PAGO_CLIENT_ID");
  if (!getOptionalEnv("MERCADO_PAGO_CLIENT_SECRET", ["MP_CLIENT_SECRET"]) && !settings.mp_client_secret) missingConfig.push("MERCADO_PAGO_CLIENT_SECRET");
  if (!getOptionalEnv("APP_BASE_URL") && !settings.app_base_url) missingConfig.push("APP_BASE_URL");
  if (!getOptionalEnv("MERCADO_PAGO_WEBHOOK_SECRET", ["MP_WEBHOOK_SECRET"]) && !settings.mp_webhook_secret) missingConfig.push("MERCADO_PAGO_WEBHOOK_SECRET");

  return {
    payment_mode: settings.payment_mode,
    webhooks_enabled: settings.webhooks_enabled,
    payment_topic_enabled: settings.payment_topic_enabled,
    accessTokenConfigured: Boolean(connection?.accessTokenEncrypted),
    oauthConfigured,
    webhookSecretConfigured,
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
