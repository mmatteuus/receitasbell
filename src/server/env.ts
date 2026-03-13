export function getRequiredEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getGoogleEnv() {
  return {
    projectId: getRequiredEnv("GOOGLE_PROJECT_ID"),
    clientEmail: getRequiredEnv("GOOGLE_CLIENT_EMAIL"),
    privateKey: getRequiredEnv("GOOGLE_PRIVATE_KEY").replace(/\\n/g, "\n"),
    spreadsheetId: getRequiredEnv("GOOGLE_SPREADSHEET_ID"),
  };
}

export function getAdminApiSecret() {
  return getRequiredEnv("ADMIN_API_SECRET");
}

export function hasMercadoPagoConfig() {
  return Boolean(process.env.MP_ACCESS_TOKEN && process.env.MP_WEBHOOK_SECRET);
}
