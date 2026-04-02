import { supabaseAdmin } from './supabase-admin.js';

/**
 * Deriva o status canônico da conta Stripe Connect com base nas flags de ativação.
 */
export function deriveStatus(input: {
  chargesEnabled?: boolean;
  payoutsEnabled?: boolean;
  detailsSubmitted?: boolean;
  disabledReason?: string | null;
}) {
  if (input.disabledReason) return 'rejected';
  if (input.chargesEnabled && input.payoutsEnabled) return 'active';
  if (input.detailsSubmitted) return 'restricted';
  return 'pending';
}

/**
 * Busca os dados de conexão do Stripe de um tenant específico.
 */
export async function findConnectAccountByTenant(tenantId: string) {
  const { data, error } = await supabaseAdmin
    .from('stripe_connect_accounts')
    .select('*')
    .eq('tenant_id', tenantId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * Salva ou atualiza (upsert) o estado de uma conta Stripe Connect no banco de dados.
 */
export async function upsertConnectAccount(payload: {
  tenantId: string;
  stripeAccountId: string;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  currentlyDue: string[];
  eventuallyDue: string[];
  defaultCurrency?: string | null;
  disabledReason?: string | null;
}) {
  const status = deriveStatus({
    chargesEnabled: payload.chargesEnabled,
    payoutsEnabled: payload.payoutsEnabled,
    detailsSubmitted: payload.detailsSubmitted,
    disabledReason: payload.disabledReason,
  });

  const { data, error } = await supabaseAdmin
    .from('stripe_connect_accounts')
    .upsert({
      tenant_id: payload.tenantId,
      stripe_account_id: payload.stripeAccountId,
      status,
      details_submitted: payload.detailsSubmitted,
      charges_enabled: payload.chargesEnabled,
      payouts_enabled: payload.payoutsEnabled,
      requirements_currently_due_json: payload.currentlyDue,
      requirements_eventually_due_json: payload.eventuallyDue,
      default_currency: payload.defaultCurrency ?? 'BRL',
      disabled_reason: payload.disabledReason ?? null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'tenant_id' })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}
