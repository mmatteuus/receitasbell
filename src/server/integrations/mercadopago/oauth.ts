import { getMercadoPagoAppEnvAsync } from "../../shared/env.js";
import { ApiError } from "../../shared/http.js";
import { createOpaqueState, hashOpaqueState } from "../../shared/state.js";
import { fetchBaserow, BASEROW_TABLES } from "../baserow/client.js";
import { upsertTenantMercadoPagoConnection } from "./connections.js";

type OAuthStateRow = {
  id?: string | number;
  tenantId?: string | number;
  tenantUserId?: string | number;
  expiresAt?: string;
  returnTo?: string | null;
};

type OAuthTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  user_id?: string | number;
  public_key?: string;
};

function sanitizeReturnTo(value: string | undefined | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/admin/pagamentos/configuracoes";
  return value;
}

export async function getMercadoPagoConnectUrl(tenantId: string | number, input: {
  tenantUserId?: string | null;
  returnTo?: string | null;
}) {
  if (!BASEROW_TABLES.OAUTH_STATES) {
    throw new ApiError(500, "OAuth states table is not configured.");
  }

  const { clientId, redirectUri } = await getMercadoPagoAppEnvAsync(String(tenantId));
  const state = createOpaqueState();
  const stateHash = hashOpaqueState(state);

  await fetchBaserow(`/api/database/rows/table/${BASEROW_TABLES.OAUTH_STATES}/?user_field_names=true`, {
    method: "POST",
    body: JSON.stringify({
      tenantId: String(tenantId),
      tenantUserId: input.tenantUserId ?? "system",
      stateHash,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      returnTo: sanitizeReturnTo(input.returnTo),
    }),
  });

  const url = new URL("https://auth.mercadopago.com/authorization");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("platform_id", "mp");
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("state", state);

  return {
    authorizationUrl: url.toString(),
    state,
  };
}

export async function handleMercadoPagoOAuthCallback(code: string, state: string) {
  if (!BASEROW_TABLES.OAUTH_STATES) {
    throw new ApiError(500, "OAuth states table is not configured.");
  }

  const stateHash = hashOpaqueState(state);
  const data = await fetchBaserow<{ results: OAuthStateRow[] }>(
      `/api/database/rows/table/${BASEROW_TABLES.OAUTH_STATES}/?user_field_names=true&filter__stateHash__equal=${stateHash}`
  );
  const oauthState = data.results[0];
  if (!oauthState) throw new ApiError(400, "OAuth state inválido ou expirado.");
  const tenantId = oauthState.tenantId != null ? String(oauthState.tenantId) : "";
  if (!tenantId) throw new ApiError(400, "OAuth state sem tenant.");

  if (!oauthState.expiresAt || new Date(oauthState.expiresAt).getTime() <= Date.now()) {
    await fetchBaserow(`/api/database/rows/table/${BASEROW_TABLES.OAUTH_STATES}/${oauthState.id}/`, { method: "DELETE" });
    throw new ApiError(410, "OAuth state expirado.");
  }

  // One-time state: consume it before exchanging the code to prevent replay.
  await fetchBaserow(`/api/database/rows/table/${BASEROW_TABLES.OAUTH_STATES}/${oauthState.id}/`, { method: "DELETE" });

  const { clientId, clientSecret, redirectUri } = await getMercadoPagoAppEnvAsync(tenantId);
  const tokenResponse = await fetch("https://api.mercadopago.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "authorization_code",
      code: code,
      redirect_uri: redirectUri,
    }),
  });

  const tokenData = (await tokenResponse.json().catch(() => null)) as OAuthTokenResponse | null;
  if (!tokenResponse.ok || !tokenData?.access_token || !tokenData.user_id) throw new ApiError(502, "Falha ao concluir a autorização com o Mercado Pago.");

  await upsertTenantMercadoPagoConnection({
    tenantId,
    actorUserId: oauthState.tenantUserId != null ? String(oauthState.tenantUserId) : "system",
    mercadoPagoUserId: String(tokenData.user_id),
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token || null,
    expiresIn: tokenData.expires_in ?? null,
    publicKey: tokenData.public_key ?? null,
  });

  return { tenantId, returnTo: sanitizeReturnTo(oauthState.returnTo) };
}
