// src/server/integrations/stripe/oauth.ts
import { getStripeAppEnvAsync } from '../../shared/env.js';
import { ApiError } from '../../shared/http.js';
import { createOpaqueState, hashOpaqueState } from '../../shared/state.js';
import { supabaseAdmin } from '../../integrations/supabase/client.js';
import { exchangeStripeOAuthCode } from './client.js';
import { upsertTenantStripeConnection } from './connections.js';

type OAuthStateRow = {
  id: string;
  tenant_id: string | number;
  tenant_user_id: string | number;
  state_hash: string;
  expires_at: string;
  return_to: string | null;
};

function sanitizeReturnTo(value: string | null | undefined): string {
  if (!value || !value.startsWith('/') || value.startsWith('//'))
    return '/admin/pagamentos/configuracoes';
  return value;
}

export async function getStripeConnectUrl(
  tenantId: string | number,
  input: { tenantUserId?: string | null; returnTo?: string | null }
): Promise<{ authorizationUrl: string; state: string }> {
  const { clientId, redirectUri } = await getStripeAppEnvAsync(String(tenantId));
  const state = createOpaqueState();
  const stateHash = hashOpaqueState(state);

  const { error } = await supabaseAdmin.from('stripe_oauth_states').insert({
    tenant_id: String(tenantId),
    tenant_user_id: String(input.tenantUserId ?? 'system'),
    state_hash: stateHash,
    expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    return_to: sanitizeReturnTo(input.returnTo),
  });

  if (error) throw new ApiError(500, 'Erro ao salvar OAuth state do Stripe', { original: error });

  const url = new URL('https://connect.stripe.com/oauth/authorize');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', 'read_write');
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('state', state);
  return { authorizationUrl: url.toString(), state };
}

export async function handleStripeOAuthCallback(
  code: string,
  state: string
): Promise<{ tenantId: string; returnTo: string }> {
  const stateHash = hashOpaqueState(state);

  const { data, error } = await supabaseAdmin
    .from('stripe_oauth_states')
    .select('*')
    .eq('state_hash', stateHash)
    .maybeSingle();

  if (error || !data) throw new ApiError(400, 'Stripe OAuth state invalido ou expirado.');

  const row = data as unknown as OAuthStateRow;
  const tenantId = row.tenant_id != null ? String(row.tenant_id) : '';
  if (!tenantId) throw new ApiError(400, 'OAuth state sem tenant.');
  if (!row.expires_at || new Date(row.expires_at).getTime() <= Date.now()) {
    await supabaseAdmin.from('stripe_oauth_states').delete().eq('id', row.id);
    throw new ApiError(410, 'Stripe OAuth state expirado.');
  }

  await supabaseAdmin.from('stripe_oauth_states').delete().eq('id', row.id);

  const tokenData = await exchangeStripeOAuthCode(code);
  await upsertTenantStripeConnection({
    tenantId,
    stripeAccountId: tokenData.stripeAccountId,
    accessToken: tokenData.accessToken,
    scope: tokenData.scope,
    actorUserId: row.tenant_user_id != null ? String(row.tenant_user_id) : 'system',
  });
  return { tenantId, returnTo: sanitizeReturnTo(row.return_to) };
}
