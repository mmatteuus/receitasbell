import type { VercelRequest } from "@vercel/node";
import { hasMercadoPagoAppConfigAsync, hasMercadoPagoWebhookSecretAsync, getOptionalEnv } from "../shared/env.js";
import { ApiError, getAppBaseUrl } from "../shared/http.js";
import { getTenantMercadoPagoConnection } from "../integrations/mercadopago/connections.js";
import { getSettingsMap, mapTypedSettings } from "../settings/repo.js";

type CheckoutUrlKind = "init_point" | "sandbox_init_point";

type PaymentReadinessInput = {
  paymentMode: "sandbox" | "production";
  webhooksEnabled: boolean;
  paymentTopicEnabled: boolean;
  oauthConfigured: boolean;
  webhookSecretConfigured: boolean;
  connectionStatus: string;
};

function resolveEffectiveCheckoutUrlKind(paymentMode: "sandbox" | "production"): CheckoutUrlKind {
  return paymentMode === "production" ? "init_point" : "sandbox_init_point";
}

function toBooleanWithDefault(value: unknown, defaultValue: boolean) {
  if (value === true || value === "true") return true;
  if (value === false || value === "false") return false;
  return defaultValue;
}

function toPaymentModeWithDefault(value: unknown, defaultValue: "sandbox" | "production") {
  if (value === "production") return "production";
  if (value === "sandbox") return "sandbox";
  return defaultValue;
}

export function evaluatePaymentReadiness(input: PaymentReadinessInput) {
  const blockingReasons: string[] = [];
  if (!input.oauthConfigured) blockingReasons.push("oauth_app_not_configured");
  if (!input.webhookSecretConfigured) blockingReasons.push("webhook_secret_not_configured");
  if (input.connectionStatus !== "connected") blockingReasons.push("mercadopago_connection_not_connected");
  if (!input.webhooksEnabled) blockingReasons.push("webhooks_disabled");
  if (!input.paymentTopicEnabled) blockingReasons.push("payment_topic_disabled");

  return {
    productionReady: blockingReasons.length === 0,
    blockingReasons: input.paymentMode === "production" ? blockingReasons : [],
    effectiveCheckoutUrlKind: resolveEffectiveCheckoutUrlKind(input.paymentMode),
  };
}

export async function assertPaymentSettingsPatchAllowed(
  tenantId: string | number,
  patch: Record<string, unknown>,
) {
  const touchesPaymentControls = (
    Object.prototype.hasOwnProperty.call(patch, "payment_mode")
    || Object.prototype.hasOwnProperty.call(patch, "webhooks_enabled")
    || Object.prototype.hasOwnProperty.call(patch, "payment_topic_enabled")
  );
  if (!touchesPaymentControls) {
    return null;
  }

  const [settings, connection, oauthConfigured, webhookSecretConfigured] = await Promise.all([
    getSettingsMap(tenantId).then(mapTypedSettings),
    getTenantMercadoPagoConnection(tenantId),
    hasMercadoPagoAppConfigAsync(String(tenantId)),
    hasMercadoPagoWebhookSecretAsync(String(tenantId)),
  ]);

  const nextPaymentMode = toPaymentModeWithDefault(patch.payment_mode, settings.payment_mode);
  const nextWebhooksEnabled = toBooleanWithDefault(patch.webhooks_enabled, settings.webhooks_enabled);
  const nextPaymentTopicEnabled = toBooleanWithDefault(patch.payment_topic_enabled, settings.payment_topic_enabled);
  const connectionStatus = connection?.status ?? "disconnected";

  const readiness = evaluatePaymentReadiness({
    paymentMode: nextPaymentMode,
    webhooksEnabled: nextWebhooksEnabled,
    paymentTopicEnabled: nextPaymentTopicEnabled,
    oauthConfigured,
    webhookSecretConfigured,
    connectionStatus,
  });

  if (nextPaymentMode === "production" && !readiness.productionReady) {
    throw new ApiError(409, "Tenant ainda não está pronto para ativar o modo produção.", {
      blockingReasons: readiness.blockingReasons,
    });
  }

  return {
    nextPaymentMode,
    nextWebhooksEnabled,
    nextPaymentTopicEnabled,
    readiness,
  };
}

export async function getTenantAdminPaymentSettings(request: VercelRequest, tenantId: string) {
  const [settings, connection, oauthConfigured, webhookSecretConfigured] = await Promise.all([
    getSettingsMap(tenantId).then(mapTypedSettings),
    getTenantMercadoPagoConnection(tenantId),
    hasMercadoPagoAppConfigAsync(tenantId),
    hasMercadoPagoWebhookSecretAsync(tenantId),
  ]);

  const missingConfig: string[] = [];
  if (!oauthConfigured) {
    missingConfig.push("MERCADO_PAGO_CLIENT_ID");
    missingConfig.push("MERCADO_PAGO_CLIENT_SECRET");
  }
  if (!getOptionalEnv("APP_BASE_URL")) missingConfig.push("APP_BASE_URL");
  if (!webhookSecretConfigured) missingConfig.push("MERCADO_PAGO_WEBHOOK_SECRET");

  const readiness = evaluatePaymentReadiness({
    paymentMode: settings.payment_mode,
    webhooksEnabled: settings.webhooks_enabled,
    paymentTopicEnabled: settings.payment_topic_enabled,
    oauthConfigured,
    webhookSecretConfigured,
    connectionStatus: connection?.status ?? "disconnected",
  });

  return {
    payment_mode: settings.payment_mode,
    webhooks_enabled: settings.webhooks_enabled,
    payment_topic_enabled: settings.payment_topic_enabled,
    accessTokenConfigured: Boolean(connection?.accessTokenEncrypted && connection.status === "connected"),
    oauthConfigured,
    webhookSecretConfigured,
    missingConfig,
    userId: connection?.mercadoPagoUserId ?? null,
    publicKey: connection?.publicKey ?? null,
    webhookUrl: `${getAppBaseUrl(request).replace(/\/+$/, "")}/api/checkout/webhook`,
    connectionStatus: connection?.status ?? "disconnected",
    connectedAt: connection?.connectedAt ?? null,
    connectionExpiresAt: connection?.expiresAt ?? null,
    disconnectedAt: connection?.disconnectedAt ?? null,
    lastError: connection?.lastError ?? null,
    productionReady: readiness.productionReady,
    blockingReasons: readiness.blockingReasons,
    effectiveCheckoutUrlKind: readiness.effectiveCheckoutUrlKind,
    tenantId,
  };
}
