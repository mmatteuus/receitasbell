import { getMercadoPagoAppEnvAsync } from "../../shared/env.js";
import { ApiError } from "../../shared/http.js";
import { createOpaqueState, hashOpaqueState } from "../../shared/state.js";
import { fetchBaserow, BASEROW_TABLES } from "../baserow/client.js";
import { upsertTenantMercadoPagoConnection } from "./connections.js";

type OAuthStateRow = {
  id?: string | number;
  tenantId?: string | number;
  tenant_id?: string | number;
  tenantUserId?: string | number;
  tenant_user_id?: string | number;
  expiresAt?: string;
  expires_at?: string;
  returnTo?: string | null;
  return_to?: string | null;
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

function isBadRequestError(error: unknown) {
  if (!error || typeof error !== "object" || !("status" in error)) {
    return false;
  }
  return Number((error as { status?: unknown }).status) === 400;
}

function normalizeOAuthStateRow(row: OAuthStateRow | undefined) {
  if (!row) return null;
  return {
    id: row.id,
    tenantId: row.tenantId ?? row.tenant_id,
    tenantUserId: row.tenantUserId ?? row.tenant_user_id,
    expiresAt: row.expiresAt ?? row.expires_at,
    returnTo: row.returnTo ?? row.return_to,
  };
}

async function createOAuthStateRow(tableId: string | number, payload: {
  tenantId: string;
  tenantUserId: string;
  stateHash: string;
  expiresAt: string;
  returnTo: string;
}) {
  const basePath = `/api/database/rows/table/${tableId}/?user_field_names=true`;
  try {
    await fetchBaserow(basePath, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  } catch (error) {
    if (!isBadRequestError(error)) {
      throw error;
    }

    await fetchBaserow(basePath, {
      method: "POST",
      body: JSON.stringify({
        tenant_id: payload.tenantId,
        tenant_user_id: payload.tenantUserId,
        state_hash: payload.stateHash,
        expires_at: payload.expiresAt,
        return_to: payload.returnTo,
      }),
    });
  }
}

export async function getMercadoPagoConnectUrl(tenantId: string | number, input: {
  tenantUserId?: string | null;
  returnTo?: string | null;
}) {
  if (!BASEROW_TABLES.OAUTH_STATES) {
    throw new ApiError(500, "OAuth states table is not configured.");
  }

  let clientId = "";
  let redirectUri = "";
  try {
    const appEnv = await getMercadoPagoAppEnvAsync(String(tenantId));
    clientId = appEnv.clientId;
    redirectUri = appEnv.redirectUri;
  } catch {
    throw new ApiError(
      503,
      "A configuração OAuth do Mercado Pago não está disponível. Verifique CLIENT_ID/CLIENT_SECRET.",
    );
  }

  const state = createOpaqueState();
  const stateHash = hashOpaqueState(state);

  await createOAuthStateRow(BASEROW_TABLES.OAUTH_STATES, {
    tenantId: String(tenantId),
    tenantUserId: String(input.tenantUserId ?? "system"),
    stateHash,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    returnTo: sanitizeReturnTo(input.returnTo),
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
  const primaryData = await fetchBaserow<{ results: OAuthStateRow[] }>(
      `/api/database/rows/table/${BASEROW_TABLES.OAUTH_STATES}/?user_field_names=true&filter__stateHash__equal=${encodeURIComponent(stateHash)}`
  );
  const fallbackData =
    primaryData.results.length === 0
      ? await fetchBaserow<{ results: OAuthStateRow[] }>(
          `/api/database/rows/table/${BASEROW_TABLES.OAUTH_STATES}/?user_field_names=true&filter__state_hash__equal=${encodeURIComponent(stateHash)}`
        )
      : null;

  const oauthState = normalizeOAuthStateRow((fallbackData?.results ?? primaryData.results)[0]);
  if (!oauthState) throw new ApiError(400, "OAuth state inválido ou expirado.");
  const tenantId = oauthState.tenantId != null ? String(oauthState.tenantId) : "";
  if (!tenantId) throw new ApiError(400, "OAuth state sem tenant.");

  if (!oauthState.expiresAt || new Date(oauthState.expiresAt).getTime() <= Date.now()) {
    await fetchBaserow(`/api/database/rows/table/${BASEROW_TABLES.OAUTH_STATES}/${oauthState.id}/`, { method: "DELETE" });
    throw new ApiError(410, "OAuth state expirado.");
  }

  // One-time state: consume it before exchanging the code to prevent replay.
  await fetchBaserow(`/api/database/rows/table/${BASEROW_TABLES.OAUTH_STATES}/${oauthState.id}/`, { method: "DELETE" });

  let clientId = "";
  let clientSecret = "";
  let redirectUri = "";
  try {
    const appEnv = await getMercadoPagoAppEnvAsync(tenantId);
    clientId = appEnv.clientId;
    clientSecret = appEnv.clientSecret;
    redirectUri = appEnv.redirectUri;
  } catch {
    throw new ApiError(
      503,
      "A configuração OAuth do Mercado Pago não está disponível. Verifique CLIENT_ID/CLIENT_SECRET.",
    );
  }

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
