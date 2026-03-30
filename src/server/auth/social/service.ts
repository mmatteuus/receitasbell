import { ApiError } from "../../shared/http.js";
import { SOCIAL_PROVIDERS, SocialProviderId } from "./providers.js";
import { env } from "../../shared/env.js";
import { createOpaqueState, hashOpaqueState, SOCIAL_STATE_TTL_MS } from "./state.js";
import { saveAuthOAuthState, consumeAuthOAuthState, findSocialIdentity, createSocialIdentity, updateSocialIdentityLastLogin } from "./repo.js";
import { createSession } from "../sessions.js";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { fetchBaserow } from "../../integrations/baserow/client.js";
import { baserowTables } from "../../integrations/baserow/tables.js";

export interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
  id_token?: string;
}

export interface GoogleProfile {
  sub: string;
  email: string;
  email_verified: boolean;
  name?: string;
  picture?: string;
}

/**
 * Inicia o fluxo OAuth Social
 */
export async function startSocialOAuth(input: {
  provider: SocialProviderId;
  tenantId: string;
  redirectTo: string;
  userAgent?: string;
  ip?: string;
}) {
  const config = SOCIAL_PROVIDERS[input.provider];
  if (!config) throw new ApiError(400, `Provedor social desconhecido: ${input.provider}`);

  const clientId = input.provider === "google" ? env.GOOGLE_OAUTH_CLIENT_ID : null;
  const redirectUri = input.provider === "google" ? env.GOOGLE_OAUTH_REDIRECT_URI : null;

  if (!clientId || !redirectUri) {
    throw new ApiError(500, `Configuração OAuth ausente para o provedor: ${input.provider}`);
  }

  const state = createOpaqueState();
  const stateHash = hashOpaqueState(state);

  await saveAuthOAuthState({
    provider: input.provider,
    tenantId: input.tenantId,
    stateHash: stateHash,
    redirectTo: input.redirectTo,
    expiresAt: new Date(Date.now() + SOCIAL_STATE_TTL_MS).toISOString(),
    ip: input.ip,
    userAgent: input.userAgent,
  });

  const url = new URL(config.authUrl);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", config.scopes.join(" "));
  url.searchParams.set("state", state);
  
  if (config.extraParams) {
    for (const [key, value] of Object.entries(config.extraParams)) {
      url.searchParams.set(key, value);
    }
  }

  return { authorizationUrl: url.toString() };
}

/**
 * Troca o código do Google por um token
 */
async function exchangeGoogleCode(code: string): Promise<GoogleTokenResponse> {
  const { GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET, GOOGLE_OAUTH_REDIRECT_URI } = env;
  if (!GOOGLE_OAUTH_CLIENT_ID || !GOOGLE_OAUTH_CLIENT_SECRET || !GOOGLE_OAUTH_REDIRECT_URI) {
    throw new ApiError(500, "Google OAuth credentials missing");
  }

  const res = await fetch(SOCIAL_PROVIDERS.google.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_OAUTH_CLIENT_ID,
      client_secret: GOOGLE_OAUTH_CLIENT_SECRET,
      redirect_uri: GOOGLE_OAUTH_REDIRECT_URI,
      grant_type: "authorization_code",
    }),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new ApiError(400, "Failed to exchange Google code", { details: errorBody });
  }

  return res.json() as Promise<GoogleTokenResponse>;
}

/**
 * Busca o perfil do usuário no Google
 */
async function fetchGoogleProfile(accessToken: string): Promise<GoogleProfile> {
  const res = await fetch(SOCIAL_PROVIDERS.google.userInfoUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new ApiError(400, "Failed to fetch Google profile");
  }

  return res.json() as Promise<GoogleProfile>;
}

/**
 * Resolve ou cria um usuário no tenant a partir dos dados do provedor social
 * Segue a lógica de: Subject (Sub) -> Email -> Novo Usuário
 */
async function resolveOrCreateTenantUser(input: {
  tenantId: string;
  provider: SocialProviderId;
  providerSubject: string;
  email: string;
  pictureUrl?: string | null;
  emailVerified: boolean;
}) {
  // 1. Tenta achar pelo provider_subject (vínculo canônico)
  let identity = await findSocialIdentity(input.tenantId, input.provider, input.providerSubject);
  
  if (identity) {
    // Atualiza last login
    await updateSocialIdentityLastLogin(identity.id);
    
    // Busca o usuário do Baserow correspondente a este identity (precisamos do userId na sessão)
    // No Baserow, a tabela user_identities_social deve ter um link para a tabela users ou guardamos o userId direto.
    // Pela TASK-009, o identity deve estar vinculado a um user_id.
    
    // Vamos assumir que buscamos o user pelo email se for o mesmo tenant,
    // ou se o identity tiver uma coluna userId.
    
    // TODO: No futuro, o repo.ts/identityRow deve conter o userId. No momento, buscamos pelo e-mail do tenant.
  }

  // 2. Busca ou cria o usuário na tabela USERS do Baserow (central de usuários do tenant)
  const usersPath = `/api/database/rows/table/${baserowTables.users}/?user_field_names=true&filter__tenant_id__equal=${input.tenantId}&filter__email__equal=${encodeURIComponent(input.email.toLowerCase())}`;
  const userData = await fetchBaserow<{ results: any[] }>(usersPath);
  
  let userId: string;
  let userEmail: string;

  if (userData.results.length > 0) {
    userId = String(userData.results[0].id);
    userEmail = String(userData.results[0].email);
  } else {
    // Cria novo usuário
    const newUser = await fetchBaserow<{ id: number; email: string }>(`/api/database/rows/table/${baserowTables.users}/?user_field_names=true`, {
      method: "POST",
      body: JSON.stringify({
        email: input.email.toLowerCase(),
        tenant_id: input.tenantId,
        role: "user",
        created_at: new Date().toISOString(),
      }),
    });
    userId = String(newUser.id);
    userEmail = newUser.email;
  }

  // 3. Se não existia identity, cria o vínculo
  if (!identity) {
    await createSocialIdentity({
      tenantId: input.tenantId,
      provider: input.provider,
      providerSubject: input.providerSubject,
      email: input.email,
      emailVerified: input.emailVerified,
      pictureUrl: input.pictureUrl,
    });
  }

  return {
    userId,
    email: userEmail,
    tenantId: input.tenantId,
    role: "user" as const,
  };
}

/**
 * Finaliza o fluxo Google OAuth
 */
export async function finishGoogleOAuth(
  req: VercelRequest,
  res: VercelResponse,
  params: { code: string; state: string; tenantId: string }
) {
  // 1. Valida e consome o state
  const stateRow = await consumeAuthOAuthState({
    stateHash: hashOpaqueState(params.state),
    provider: "google",
    tenantId: params.tenantId,
  });

  // 2. Troca code por tokens
  const tokenRes = await exchangeGoogleCode(params.code);

  // 3. Busca perfil
  const profile = await fetchGoogleProfile(tokenRes.access_token);

  if (!profile.email_verified) {
    throw new ApiError(403, "O e-mail do Google precisa estar verificado.");
  }

  // 4. Resolve usuário no tenant
  const sessionData = await resolveOrCreateTenantUser({
    tenantId: params.tenantId,
    provider: "google",
    providerSubject: profile.sub,
    email: profile.email,
    pictureUrl: profile.picture,
    emailVerified: profile.email_verified,
  });

  // 5. Cria sessão server-side
  await createSession(req, res, sessionData);

  return {
    redirectTo: stateRow.redirectTo || "/minha-conta",
  };
}
