import { supabaseAdmin } from "../../integrations/supabase/client.js";
import { ApiError } from "../../shared/http.js";
import type { StripeConnectAccount } from "../core/types.js";

type StripeConnectRow = {
  tenant_id: string;
  stripe_account_id: string;
  status: string;
  details_submitted: boolean;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  requirements_currently_due_json?: string[] | null;
  requirements_eventually_due_json?: string[] | null;
  default_currency: string;
  disabled_reason?: string | null;
  created_at: string;
  updated_at: string;
};

export async function getConnectAccountByTenantId(tenantId: string): Promise<StripeConnectAccount | null> {
  const { data, error } = await supabaseAdmin
    .from("stripe_connect_accounts")
    .select("*")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (error || !data) return null;
  return mapRowToAccount(data as StripeConnectRow);
}

export async function upsertConnectAccount(account: Partial<StripeConnectAccount> & { tenantId: string }): Promise<StripeConnectAccount> {
  const row = mapAccountToRow(account as StripeConnectAccount);
  const { data, error } = await supabaseAdmin
    .from("stripe_connect_accounts")
    .upsert(row)
    .select()
    .single();

  if (error) throw new ApiError(500, "Erro ao persistir conta Stripe Connect", { original: error });
  return mapRowToAccount(data as StripeConnectRow);
}

function mapRowToAccount(row: StripeConnectRow): StripeConnectAccount {
  return {
    tenantId: row.tenant_id,
    stripeAccountId: row.stripe_account_id,
    status: row.status as StripeConnectAccount["status"],
    detailsSubmitted: row.details_submitted,
    chargesEnabled: row.charges_enabled,
    payoutsEnabled: row.payouts_enabled,
    requirements: {
      currentlyDue: row.requirements_currently_due_json || [],
      eventuallyDue: row.requirements_eventually_due_json || [],
    },
    defaultCurrency: row.default_currency,
    disabledReason: row.disabled_reason,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapAccountToRow(account: StripeConnectAccount): Partial<StripeConnectRow> {
  return {
    tenant_id: account.tenantId,
    stripe_account_id: account.stripeAccountId,
    status: account.status,
    details_submitted: account.detailsSubmitted,
    charges_enabled: account.chargesEnabled,
    payouts_enabled: account.payoutsEnabled,
    requirements_currently_due_json: account.requirements?.currentlyDue || [],
    requirements_eventually_due_json: account.requirements?.eventuallyDue || [],
    default_currency: account.defaultCurrency || "BRL",
    disabled_reason: account.disabledReason || null,
    updated_at: new Date().toISOString(),
  };
}
