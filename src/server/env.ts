import { getSettingsMap, mapTypedSettings } from "./baserow/settingsRepo.js";

function normalizeBaseUrl(value: string) {
  return value.trim().replace(/\/+$/, "");
}

function resolveMercadoPagoRedirectUri(overrides?: { redirectUri?: string; baseUrl?: string }) {
  const explicit = (overrides?.redirectUri || getOptionalEnv("MERCADO_PAGO_REDIRECT_URI", ["MP_REDIRECT_URI"])).trim();
  if (explicit) {
    return normalizeBaseUrl(explicit);
  }

  const baseUrl = (overrides?.baseUrl || getOptionalEnv("APP_BASE_URL")).trim();
  if (baseUrl) {
    return `${normalizeBaseUrl(baseUrl)}/api/mercadopago/oauth/callback`;
  }

  throw new Error(
    "Missing required environment variable: MERCADO_PAGO_REDIRECT_URI",
  );
}

export function getRequiredEnv(name: string, fallbacks: string[] = []) {
  const candidates = [name, ...fallbacks];
  for (const candidate of candidates) {
    const value = process.env[candidate];
    if (value) {
      return value;
    }
  }

  throw new Error(`Missing required environment variable: ${name}`);
}

export function getOptionalEnv(name: string, fallbacks: string[] = []) {
  const candidates = [name, ...fallbacks];
  for (const candidate of candidates) {
    const value = process.env[candidate];
    if (value) {
      return value;
    }
  }
  return "";
}

export function getGoogleEnv() {
  const spreadsheetId =
    process.env.GOOGLE_SPREADSHEET_ID?.trim() || "16Bl040rdAjh1NKy4olidNk99F5vrsXIeyn3JeMcKWT4";

  return {
    projectId: getRequiredEnv("GOOGLE_PROJECT_ID"),
    clientEmail: getRequiredEnv("GOOGLE_CLIENT_EMAIL"),
    privateKey: getRequiredEnv("GOOGLE_PRIVATE_KEY").replace(/\\n/g, "\n"),
    spreadsheetId,
  };
}

export function getAdminApiSecret() {
  const secret = process.env.ADMIN_API_SECRET?.trim();
  if (secret) {
    return secret;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("ADMIN_API_SECRET is required in production");
  }

  return "123";
}

export function getMercadoPagoAppEnv() {
  return {
    clientId: getRequiredEnv("MERCADO_PAGO_CLIENT_ID", ["MP_CLIENT_ID"]),
    clientSecret: getRequiredEnv("MERCADO_PAGO_CLIENT_SECRET", ["MP_CLIENT_SECRET"]),
    redirectUri: resolveMercadoPagoRedirectUri(),
  };
}

export async function getMercadoPagoAppEnvAsync(tenantId: string) {
  const settings = mapTypedSettings(await getSettingsMap(tenantId));
  
  const clientId = getOptionalEnv("MERCADO_PAGO_CLIENT_ID", ["MP_CLIENT_ID"]).trim() || settings.mp_client_id;
  const clientSecret = getOptionalEnv("MERCADO_PAGO_CLIENT_SECRET", ["MP_CLIENT_SECRET"]).trim() || settings.mp_client_secret;
  
  if (!clientId || !clientSecret) {
    throw new Error("Mercado Pago App Client ID and Secret are required (Env or Sheets).");
  }

  return {
    clientId,
    clientSecret,
    redirectUri: resolveMercadoPagoRedirectUri({ 
      redirectUri: settings.mp_redirect_uri, 
      baseUrl: settings.app_base_url 
    }),
  };
}

export function hasMercadoPagoAppConfig() {
  return Boolean(
    getOptionalEnv("MERCADO_PAGO_CLIENT_ID", ["MP_CLIENT_ID"]).trim() &&
      getOptionalEnv("MERCADO_PAGO_CLIENT_SECRET", ["MP_CLIENT_SECRET"]).trim() &&
      (getOptionalEnv("MERCADO_PAGO_REDIRECT_URI", ["MP_REDIRECT_URI"]).trim() ||
        getOptionalEnv("APP_BASE_URL").trim()),
  );
}

export async function hasMercadoPagoAppConfigAsync(tenantId: string) {
  try {
    const settings = mapTypedSettings(await getSettingsMap(tenantId));
    const hasClientId = Boolean(getOptionalEnv("MERCADO_PAGO_CLIENT_ID", ["MP_CLIENT_ID"]).trim() || settings.mp_client_id);
    const hasClientSecret = Boolean(getOptionalEnv("MERCADO_PAGO_CLIENT_SECRET", ["MP_CLIENT_SECRET"]).trim() || settings.mp_client_secret);
    const hasRedirect = Boolean(
      getOptionalEnv("MERCADO_PAGO_REDIRECT_URI", ["MP_REDIRECT_URI"]).trim() || 
      getOptionalEnv("APP_BASE_URL").trim() ||
      settings.mp_redirect_uri ||
      settings.app_base_url
    );
    return hasClientId && hasClientSecret && hasRedirect;
  } catch {
    return false;
  }
}

export function getMercadoPagoWebhookSecret() {
  return getRequiredEnv("MERCADO_PAGO_WEBHOOK_SECRET", ["MP_WEBHOOK_SECRET"]);
}

export async function getMercadoPagoWebhookSecretAsync(tenantId: string) {
  const settings = mapTypedSettings(await getSettingsMap(tenantId));
  return getOptionalEnv("MERCADO_PAGO_WEBHOOK_SECRET", ["MP_WEBHOOK_SECRET"]).trim() || settings.mp_webhook_secret;
}

export function hasMercadoPagoWebhookSecret() {
  return Boolean(getOptionalEnv("MERCADO_PAGO_WEBHOOK_SECRET", ["MP_WEBHOOK_SECRET"]).trim());
}

export async function hasMercadoPagoWebhookSecretAsync(tenantId: string) {
  const settings = mapTypedSettings(await getSettingsMap(tenantId));
  return Boolean(
    getOptionalEnv("MERCADO_PAGO_WEBHOOK_SECRET", ["MP_WEBHOOK_SECRET"]).trim() || 
    settings.mp_webhook_secret
  );
}

export async function getMercadoPagoEnv(tenantId: string) {
  const settings = mapTypedSettings(await getSettingsMap(tenantId));
  return {
    accessToken: settings.mp_access_token || getOptionalEnv("MP_ACCESS_TOKEN"),
    webhookSecret: getOptionalEnv("MERCADO_PAGO_WEBHOOK_SECRET", ["MP_WEBHOOK_SECRET"]) || settings.mp_webhook_secret,
  };
}

export async function hasMercadoPagoConfig(tenantId: string) {
  const env = await getMercadoPagoEnv(tenantId);
  return Boolean(env.accessToken);
}

