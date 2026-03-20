import { getSettingsMap, mapTypedSettings } from "./sheets/settingsRepo.js";

function normalizeBaseUrl(value: string) {
  return value.trim().replace(/\/+$/, "");
}

function resolveMercadoPagoRedirectUri() {
  const explicit = getOptionalEnv("MERCADO_PAGO_REDIRECT_URI", ["MP_REDIRECT_URI"]).trim();
  if (explicit) {
    return normalizeBaseUrl(explicit);
  }

  const baseUrl = getOptionalEnv("APP_BASE_URL").trim();
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

export function hasMercadoPagoAppConfig() {
  return Boolean(
    getOptionalEnv("MERCADO_PAGO_CLIENT_ID", ["MP_CLIENT_ID"]).trim() &&
      getOptionalEnv("MERCADO_PAGO_CLIENT_SECRET", ["MP_CLIENT_SECRET"]).trim() &&
      (getOptionalEnv("MERCADO_PAGO_REDIRECT_URI", ["MP_REDIRECT_URI"]).trim() ||
        getOptionalEnv("APP_BASE_URL").trim()),
  );
}

export function getMercadoPagoWebhookSecret() {
  return getRequiredEnv("MERCADO_PAGO_WEBHOOK_SECRET", ["MP_WEBHOOK_SECRET"]);
}

export function hasMercadoPagoWebhookSecret() {
  return Boolean(getOptionalEnv("MERCADO_PAGO_WEBHOOK_SECRET", ["MP_WEBHOOK_SECRET"]).trim());
}

export async function getMercadoPagoEnv() {
  const settings = mapTypedSettings(await getSettingsMap());
  return {
    accessToken: settings.mp_access_token || getOptionalEnv("MP_ACCESS_TOKEN"),
    webhookSecret: getOptionalEnv("MERCADO_PAGO_WEBHOOK_SECRET", ["MP_WEBHOOK_SECRET"]),
  };
}

export async function hasMercadoPagoConfig() {
  const env = await getMercadoPagoEnv();
  return Boolean(env.accessToken);
}
