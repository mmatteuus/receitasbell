import { decryptSecret, encryptSecret } from "../../shared/crypto.js";
import { redactErrorMessage } from "../../shared/masking.js";
import { ApiError } from "../../shared/http.js";
import { getMercadoPagoAppEnvAsync } from "../../shared/env.js";
import { getSettingsMap, saveSettings } from "../baserow/settingsRepo.js";

export { getMercadoPagoAppEnvAsync };

type OAuthTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  user_id?: number | string;
  public_key?: string;
};

export async function getTenantMercadoPagoConnection(tenantId: string | number): Promise<any> {
  const settings = await getSettingsMap(tenantId);
  if (!settings.mp_access_token) return null;
  
  return {
    id: `settings_${tenantId}`,
    tenantId,
    mercadoPagoUserId: settings.mp_user_id,
    accessTokenEncrypted: encryptSecret(settings.mp_access_token),
    refreshTokenEncrypted: settings.mp_refresh_token ? encryptSecret(settings.mp_refresh_token) : null,
    publicKey: settings.mp_public_key,
    status: settings.mp_access_token ? "connected" : "disconnected",
    connectedAt: new Date().toISOString(),
  };
}

export async function requireTenantMercadoPagoConnection(tenantId: string) {
  const connection = await getTenantMercadoPagoConnection(tenantId);
  if (!connection) throw new ApiError(409, "Conecte uma conta do Mercado Pago antes de ativar pagamentos.");
  return connection;
}

export function readConnectionSecrets(connection: any) {
  return {
    accessToken: decryptSecret(connection.accessTokenEncrypted),
    refreshToken: connection.refreshTokenEncrypted ? decryptSecret(connection.refreshTokenEncrypted) : null,
  };
}

export async function upsertTenantMercadoPagoConnection(input: {
  tenantId: string | number;
  mercadoPagoUserId: string;
  accessToken: string;
  refreshToken?: string | null;
  expiresIn?: number | null;
  publicKey?: string | null;
  actorUserId?: string | null;
}) {
  await saveSettings(input.tenantId, {
    mp_access_token: input.accessToken,
    mp_refresh_token: input.refreshToken || "",
    mp_public_key: input.publicKey || "",
    mp_user_id: input.mercadoPagoUserId,
  });
  
  return { 
    id: `settings_${input.tenantId}`, 
    tenantId: input.tenantId,
    status: "connected" as const, 
    mercadoPagoUserId: input.mercadoPagoUserId,
    accessTokenEncrypted: encryptSecret(input.accessToken),
    refreshTokenEncrypted: input.refreshToken ? encryptSecret(input.refreshToken) : null,
    publicKey: input.publicKey || null,
    connectedAt: new Date().toISOString(),
  };
}

export async function disconnectTenantMercadoPagoConnection(input: {
  tenantId: string | number;
  actorUserId?: string | null;
}) {
  await saveSettings(input.tenantId, {
    mp_access_token: "",
    mp_refresh_token: "",
    mp_user_id: "",
  });
  return true;
}

export async function refreshMercadoPagoConnection(connectionId: string) {
  const tenantId = connectionId.replace("settings_", "");
  const connection = await getTenantMercadoPagoConnection(tenantId);
  if (!connection) throw new ApiError(404, "Mercado Pago connection not found.");

  const { refreshToken } = readConnectionSecrets(connection);
  if (!refreshToken) throw new ApiError(409, "A conexão com o Mercado Pago precisa ser refeita.");

  const { clientId, clientSecret } = await getMercadoPagoAppEnvAsync(String(tenantId));
  const response = await fetch("https://api.mercadopago.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  const body = (await response.json().catch(() => null)) as OAuthTokenResponse | null;
  if (!response.ok || !body?.access_token) {
    throw new ApiError(409, "A conexão com o Mercado Pago expirou. Reconecte a conta para continuar.");
  }

  return upsertTenantMercadoPagoConnection({
    tenantId: connection.tenantId,
    mercadoPagoUserId: String(body.user_id ?? connection.mercadoPagoUserId),
    accessToken: body.access_token,
    refreshToken: body.refresh_token || refreshToken,
    expiresIn: body.expires_in ?? null,
    publicKey: body.public_key ?? connection.publicKey,
  });
}

export async function getUsableMercadoPagoAccessToken(tenantId: string) {
  const connection = await requireTenantMercadoPagoConnection(tenantId);
  if (connection.status === "disconnected") throw new ApiError(409, "A conta do Mercado Pago está desconectada.");
  
  return {
    connection,
    accessToken: decryptSecret(connection.accessTokenEncrypted),
  };
}
