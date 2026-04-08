import { ApiError } from "../../shared/http.js";
import { SOCIAL_PROVIDERS, SocialProviderId } from "./providers.js";
import { env } from "../../shared/env.js";
import { createOpaqueState, hashOpaqueState, SOCIAL_STATE_TTL_MS } from "./state.js";
import { 
  saveAuthOAuthState, 
  consumeAuthOAuthState, 
  findSocialIdentity, 
  createSocialIdentity, 
  updateSocialIdentityLastLogin 
} from "./repo.js";
import { createSession, type Session } from "../sessions.js";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseAdmin } from "../../integrations/supabase/client.js";
import { logger } from "../../shared/logger.js";

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

function sanitizeRedirectTo(redirectTo: string | undefined) {
  if (!redirectTo) return "/minha-conta";
  const value = redirectTo.trim();
  if (!value.startsWith('/')) return "/minha-conta";
  if (value.startsWith('//')) return "/minha-conta";
  return value;
}

/**
 * Inicia o fluxo OAuth Social enviando o state para o Supabase
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
  const safeRedirectTo = sanitizeRedirectTo(input.redirectTo);

  await saveAuthOAuthState({
    provider: input.provider,
    tenantId: input.tenantId,
    stateHash: stateHash,
    redirectTo: safeRedirectTo,
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

async function fetchGoogleProfile(accessToken: string): Promise<GoogleProfile> {
  const res = await fetch(SOCIAL_PROVIDERS.google.userInfoUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new ApiError(400, "Failed to fetch Google profile");
  }

  return res.json() as Promise<GoogleProfile>;
}

async function resolveOrCreateTenantUser(input: {
  tenantId: string;
  provider: SocialProviderId;
  providerSubject: string;
  email: string;
  pictureUrl?: string | null;
  emailVerified: boolean;
}) {
  const normalizedEmail = input.email.toLowerCase();

  const identity = await findSocialIdentity(input.tenantId, input.provider, input.providerSubject);
  
  if (identity) {
    await updateSocialIdentityLastLogin(identity.id);
    
    if (identity.userId) {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("id, email, role")
        .eq("id", identity.userId)
        .single();
      
      if (profile) {
        return {
          userId: profile.id,
          email: profile.email,
          tenantId: input.tenantId,
          role: (profile.role as Session["role"]) || "user",
        };
      }
    }
  }

  const { data: existingProfile } = await supabaseAdmin
    .from("profiles")
    .select("id, email, role")
    .eq("organization_id", input.tenantId)
    .eq("email", normalizedEmail)
    .maybeSingle();

  let targetUserId: string;
  let targetRole: Session["role"] = "user";

  if (existingProfile) {
    targetUserId = existingProfile.id;
    targetRole = (existingProfile.role as Session["role"]) || "user";
    logger.info("Found existing profile for social login", { email: normalizedEmail, tenantId: input.tenantId });
  } else {
    const { data: newProfile, error: createError } = await supabaseAdmin
      .from("profiles")
      .insert({
        email: normalizedEmail,
        organization_id: input.tenantId,
        role: "member",
        full_name: normalizedEmail.split("@")[0],
        avatar_url: input.pictureUrl || null,
      })
      .select()
      .single();

    if (createError || !newProfile) {
      throw new ApiError(500, "Erro ao criar perfil de usuário no Supabase", { original: createError });
    }
    
    targetUserId = newProfile.id;
    logger.info("Created new profile via social login", { email: normalizedEmail, tenantId: input.tenantId });
  }

  if (!identity) {
    await createSocialIdentity({
      tenantId: input.tenantId,
      userId: targetUserId,
      provider: input.provider,
      providerSubject: input.providerSubject,
      email: normalizedEmail,
      emailVerified: input.emailVerified,
      pictureUrl: input.pictureUrl,
    });
  } else if (!identity.userId) {
    await supabaseAdmin
      .from("user_identities_social")
      .update({ user_id: targetUserId })
      .eq("id", identity.id);
  }

  return {
    userId: targetUserId,
    email: normalizedEmail,
    tenantId: input.tenantId,
    role: targetRole,
  };
}

export async function finishGoogleOAuth(
  req: VercelRequest,
  res: VercelResponse,
  params: { code: string; state: string; tenantId?: string }
) {
  const stateHash = hashOpaqueState(params.state);

  let resolvedTenantId: string = params.tenantId || '';
  if (!resolvedTenantId) {
    const { data: stateRow, error } = await supabaseAdmin
      .from("auth_oauth_states")
      .select("tenant_id")
      .eq("state_hash", stateHash)
      .eq("provider", "google")
      .eq("status", "active")
      .maybeSingle();

    if (error || !stateRow?.tenant_id) {
      throw new ApiError(400, "Estado OAuth invalido ou sem tenant associado.");
    }

    resolvedTenantId = stateRow.tenant_id as string;
  }

  const stateRow = await consumeAuthOAuthState({
    stateHash,
    provider: "google",
    tenantId: resolvedTenantId,
  });

  const tokenRes = await exchangeGoogleCode(params.code);
  const profile = await fetchGoogleProfile(tokenRes.access_token);

  if (!profile.email_verified) {
    throw new ApiError(403, "O e-mail do Google precisa estar verificado.");
  }

  const sessionData = await resolveOrCreateTenantUser({
    tenantId: resolvedTenantId,
    provider: "google",
    providerSubject: profile.sub,
    email: profile.email,
    pictureUrl: profile.picture ?? null,
    emailVerified: profile.email_verified,
  });

  await createSession(req, res, sessionData);

  return {
    redirectTo: sanitizeRedirectTo(stateRow.redirectTo || undefined),
  };
}
