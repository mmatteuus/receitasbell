# Código Utilitário — Stripe Connect

Assinatura: Desenvolvido por MtsFerreira — https://mtsferreira.dev

## Arquivo `api/payments/_lib/stripe.ts`

```ts
import Stripe from 'stripe';

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

export const stripe = new Stripe(getEnv('STRIPE_SECRET_KEY'), {
  apiVersion: '2024-06-20',
  maxNetworkRetries: 2,
  timeout: 10000,
});

export function getAppUrl(): string {
  return getEnv('APP_URL').replace(/\/$/, '');
}
```

## Arquivo `api/payments/_lib/supabase-admin.ts`

```ts
import { createClient } from '@supabase/supabase-js';

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

export const supabaseAdmin = createClient(
  getEnv('SUPABASE_URL'),
  getEnv('SUPABASE_SERVICE_ROLE_KEY'),
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);
```

## Arquivo `api/payments/_lib/connect-store.ts`

```ts
import { supabaseAdmin } from './supabase-admin';

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

export async function findConnectAccountByTenant(tenantId: string) {
  const { data, error } = await supabaseAdmin
    .from('stripe_connect_accounts')
    .select('*')
    .eq('tenant_id', tenantId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

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
```
