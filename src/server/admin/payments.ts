import type { VercelRequest } from "@vercel/node";
import { hasMercadoPagoAppConfig, hasMercadoPagoWebhookSecret } from "../env.js";
import { getAppBaseUrl } from "../http.js";
import { getTenantMercadoPagoConnection } from "../mercadopago/connections.js";
import { getSettingsMap, mapTypedSettings } from "../sheets/settingsRepo.js";

export async function getTenantAdminPaymentSettings(request: VercelRequest, tenantId: string) {
  const [settings, connection] = await Promise.all([
    getSettingsMap().then(mapTypedSettings),
    getTenantMercadoPagoConnection(tenantId),
  ]);

  return {
    payment_mode: settings.payment_mode,
    webhooks_enabled: settings.webhooks_enabled,
    payment_topic_enabled: settings.payment_topic_enabled,
    accessTokenConfigured: Boolean(connection?.accessTokenEncrypted),
    oauthConfigured: hasMercadoPagoAppConfig(),
    webhookSecretConfigured: hasMercadoPagoWebhookSecret(),
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
