import type { VercelRequest } from "@vercel/node";
import { getSettingsMap, mapTypedSettings } from "../settings/repo.js";
import { getConnectAccountByTenantId } from "../payments/repo/accounts.js";

export async function assertPaymentSettingsPatchAllowed(
  tenantId: string | number,
  patch: Record<string, unknown>,
) {
  const settings = await getSettingsMap(tenantId).then(mapTypedSettings);

  const nextPaymentMode = patch.payment_mode || settings.payment_mode;
  const nextWebhooksEnabled = patch.webhooks_enabled !== undefined ? patch.webhooks_enabled : settings.webhooks_enabled;
  const nextPaymentTopicEnabled = patch.payment_topic_enabled !== undefined ? patch.payment_topic_enabled : settings.payment_topic_enabled;

  return {
    nextPaymentMode,
    nextWebhooksEnabled,
    nextPaymentTopicEnabled,
    readiness: {
      productionReady: true,
      blockingReasons: [],
      effectiveCheckoutUrlKind: "init_point"
    },
  };
}

export async function getTenantAdminPaymentSettings(request: VercelRequest, tenantId: string) {
  const settings = await getSettingsMap(tenantId).then(mapTypedSettings);
  const connectAccount = await getConnectAccountByTenantId(tenantId);

  const isConnected = !!connectAccount?.stripeAccountId;
  const isReady = connectAccount?.status === "ready";

  return {
    payment_mode: settings.payment_mode,
    webhooks_enabled: settings.webhooks_enabled,
    payment_topic_enabled: settings.payment_topic_enabled,
    accessTokenConfigured: isConnected,
    oauthConfigured: true,
    webhookSecretConfigured: true,
    missingConfig: !isReady ? ["onboarding_incomplete"] : [],
    userId: connectAccount?.stripeAccountId || null,
    publicKey: null,
    webhookUrl: "/api/payments/webhooks/stripe",
    connectionStatus: isConnected ? (isReady ? "connected" : "reconnect_required") : "disconnected",
    connectedAt: connectAccount?.createdAt || null,
    connectionExpiresAt: null,
    disconnectedAt: null,
    lastError: null,
    productionReady: isReady,
    blockingReasons: isReady ? [] : ["Onboarding do Stripe incompleto."],
    effectiveCheckoutUrlKind: "init_point",
    tenantId,
  };
}

export async function listPayments(tenantId: string | number) {
  return [];
}
