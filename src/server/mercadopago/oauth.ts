import { getPrisma } from "../db/prisma.js";
import { getMercadoPagoAppEnv } from "../env.js";
import { ApiError } from "../http.js";
import { createOpaqueState, hashOpaqueState, stateMatches } from "../security/state.js";
import { upsertTenantMercadoPagoConnection } from "./connections.js";

type OAuthTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  user_id?: string | number;
  public_key?: string;
};

function sanitizeReturnTo(value: string | undefined | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/admin/pagamentos/configuracoes";
  }
  return value;
}

export async function createMercadoPagoOAuthStart(input: {
  tenantId?: string | null;
  tenantUserId?: string | null;
  returnTo?: string | null;
  mode?: "connect" | "login";
}) {
  const prisma = getPrisma();
  const { clientId, redirectUri } = getMercadoPagoAppEnv();
  const state = createOpaqueState();

  await prisma.mercadoPagoOAuthState.create({
    data: {
      tenantId: input.tenantId ?? "pending", // "pending" se for via login
      tenantUserId: input.tenantUserId ?? "pending",
      stateHash: hashOpaqueState(state),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      returnTo: sanitizeReturnTo(input.returnTo),
      // Adicionaremos metadados para saber que é modo login se necessário
    },
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

export async function completeMercadoPagoOAuth(input: {
  code: string;
  state: string;
}) {
  const prisma = getPrisma();
  const hashed = hashOpaqueState(input.state);
  const oauthState = await prisma.mercadoPagoOAuthState.findUnique({
    where: { stateHash: hashed },
  });

  if (!oauthState || !stateMatches(oauthState.stateHash, input.state)) {
    throw new ApiError(400, "OAuth state inválido.");
  }
  if (oauthState.consumedAt) {
    throw new ApiError(409, "OAuth state já utilizado.");
  }
  if (oauthState.expiresAt.getTime() <= Date.now()) {
    throw new ApiError(410, "OAuth state expirado.");
  }

  const { clientId, clientSecret, redirectUri } = getMercadoPagoAppEnv();
  const tokenResponse = await fetch("https://api.mercadopago.com/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "authorization_code",
      code: input.code,
      redirect_uri: redirectUri,
    }),
  });

  const tokenData = (await tokenResponse.json().catch(() => null)) as OAuthTokenResponse | null;
  if (!tokenResponse.ok || !tokenData?.access_token || !tokenData.user_id) {
    throw new ApiError(502, "Falha ao concluir a autorização com o Mercado Pago.", {
      status: tokenResponse.status,
    });
  }

  await prisma.mercadoPagoOAuthState.update({
    where: { id: oauthState.id },
    data: { consumedAt: new Date() },
  });

  const connection = await upsertTenantMercadoPagoConnection({
    tenantId: oauthState.tenantId,
    actorUserId: oauthState.tenantUserId,
    mercadoPagoUserId: String(tokenData.user_id),
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token || null,
    expiresIn: tokenData.expires_in ?? null,
    scope: tokenData.scope ?? null,
    publicKey: tokenData.public_key ?? null,
  });

  return {
    connection,
    tenantId: oauthState.tenantId,
    tenantUserId: oauthState.tenantUserId,
    returnTo: sanitizeReturnTo(oauthState.returnTo),
  };
}
