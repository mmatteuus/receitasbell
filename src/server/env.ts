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

export function getMercadoPagoEnv() {
  return {
    accessToken: getRequiredEnv("MP_ACCESS_TOKEN"),
    webhookSecret: getRequiredEnv("MP_WEBHOOK_SECRET"),
  };
}

export function hasMercadoPagoConfig() {
  return Boolean(process.env.MP_ACCESS_TOKEN && process.env.MP_WEBHOOK_SECRET);
}
