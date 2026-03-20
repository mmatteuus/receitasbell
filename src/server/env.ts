export function getRequiredEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
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

import { getSettingsMap, mapTypedSettings } from './sheets/settingsRepo.js';

export function getMercadoPagoAppEnv() {
  return {
    clientId: getRequiredEnv("MP_CLIENT_ID"),
    clientSecret: getRequiredEnv("MP_CLIENT_SECRET"),
  };
}

export function hasMercadoPagoAppConfig() {
  return Boolean(
    process.env.MP_CLIENT_ID?.trim() &&
    process.env.MP_CLIENT_SECRET?.trim(),
  );
}

export function hasMercadoPagoWebhookSecret() {
  return Boolean(process.env.MP_WEBHOOK_SECRET?.trim());
}

export async function getMercadoPagoEnv() {
  const settings = mapTypedSettings(await getSettingsMap());
  // Fallback to process.env if set (for backward compatibility or testing)
  return {
    accessToken: settings.mp_access_token || process.env.MP_ACCESS_TOKEN || "",
    webhookSecret: process.env.MP_WEBHOOK_SECRET || "", // webhooks might still use env secretly or we can leave it empty
  };
}

export async function hasMercadoPagoConfig() {
  const env = await getMercadoPagoEnv();
  return Boolean(env.accessToken);
}
