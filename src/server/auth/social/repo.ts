import { ApiError } from "../../shared/http.js";
import { supabaseAdmin } from "../../integrations/supabase/client.js";
import { SocialIdentityRow, SocialOAuthStateRow, SaveSocialIdentityInput } from "./types.js";

/**
 * Persiste o estado do OAuth para validação de CSRF e redirecionamento.
 */
export async function saveAuthOAuthState(input: {
  provider: SocialOAuthStateRow["provider"];
  tenantId: string;
  stateHash: string;
  redirectTo: string;
  expiresAt: string;
  ip?: string;
  userAgent?: string;
}) {
  const { error } = await supabaseAdmin.from("auth_oauth_states").insert({
    provider: input.provider,
    tenant_id: input.tenantId,
    state_hash: input.stateHash,
    redirect_to: input.redirectTo,
    expires_at: input.expiresAt,
    ip: input.ip ?? null,
    user_agent: input.userAgent ?? null,
    status: "active",
  });

  if (error) {
    throw new ApiError(500, "Erro ao salvar estado OAuth no Supabase", { original: error });
  }
}

/**
 * Consome um estado OAuth válido, marcando-o como utilizado.
 */
export async function consumeAuthOAuthState(options: { 
  stateHash: string; 
  provider: SocialOAuthStateRow["provider"]; 
  tenantId: string 
}) {
  // 1. Busca o estado
  const { data: row, error: fetchError } = await supabaseAdmin
    .from("auth_oauth_states")
    .select("*")
    .eq("state_hash", options.stateHash)
    .eq("provider", options.provider)
    .eq("tenant_id", options.tenantId)
    .eq("status", "active")
    .maybeSingle();

  if (fetchError || !row) {
    throw new ApiError(400, "Estado OAuth inválido ou já consumido.");
  }

  // 2. Valida expiração
  if (new Date(row.expires_at).getTime() <= Date.now()) {
    await supabaseAdmin
      .from("auth_oauth_states")
      .update({ status: "expired" })
      .eq("id", row.id);
    throw new ApiError(410, "Estado OAuth expirado.");
  }

  // 3. Marca como consumido
  const { error: updateError } = await supabaseAdmin
    .from("auth_oauth_states")
    .update({ 
      status: "consumed", 
      consumed_at: new Date().toISOString() 
    })
    .eq("id", row.id);

  if (updateError) {
    throw new ApiError(500, "Erro ao consumir estado OAuth", { original: updateError });
  }

  return {
    id: row.id,
    provider: row.provider,
    tenantId: row.tenant_id,
    stateHash: row.state_hash,
    redirectTo: row.redirect_to,
    expiresAt: row.expires_at,
    status: "consumed",
  } as SocialOAuthStateRow;
}

/**
 * Localiza um vínculo de identidade social existente.
 */
export async function findSocialIdentity(
  tenantId: string, 
  provider: string, 
  providerSubject: string
): Promise<SocialIdentityRow | null> {
  const { data, error } = await supabaseAdmin
    .from("user_identities_social")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("provider", provider)
    .eq("provider_subject", providerSubject)
    .maybeSingle();

  if (error || !data) return null;

  return {
    id: Number(data.id),
    tenantId: data.tenant_id,
    userId: data.user_id,
    provider: data.provider as any,
    providerSubject: data.provider_subject,
    email: data.email,
    emailVerified: data.email_verified,
    pictureUrl: data.picture_url,
    linkedAt: data.linked_at,
    lastLoginAt: data.last_login_at,
    status: data.status as any,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Cria um novo vínculo de identidade social.
 */
export async function createSocialIdentity(input: SaveSocialIdentityInput & { userId?: string }) {
  const now = new Date().toISOString();
  const { error } = await supabaseAdmin.from("user_identities_social").insert({
    tenant_id: input.tenantId,
    user_id: input.userId || null,
    provider: input.provider,
    provider_subject: input.providerSubject,
    email: input.email.toLowerCase(),
    email_verified: input.emailVerified,
    picture_url: input.pictureUrl ?? null,
    linked_at: now,
    last_login_at: now,
    status: "active",
  });

  if (error) {
    throw new ApiError(500, "Erro ao criar identidade social no Supabase", { original: error });
  }
}

/**
 * Atualiza o timestamp de último login.
 */
export async function updateSocialIdentityLastLogin(rowId: number) {
  await supabaseAdmin
    .from("user_identities_social")
    .update({ 
      last_login_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq("id", rowId);
}
