# Código de Endpoints — Account e Onboarding

Assinatura: Desenvolvido por MtsFerreira — https://mtsferreira.dev

## Arquivo `api/payments/connect/account.ts`

```ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { stripe } from '../_lib/stripe';
import { findConnectAccountByTenant, upsertConnectAccount } from '../_lib/connect-store';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }

  try {
    const { tenantId, email } = req.body ?? {};
    if (!tenantId) {
      return res.status(400).json({ ok: false, error: 'missing_tenant_id' });
    }

    const existing = await findConnectAccountByTenant(tenantId);
    if (existing?.stripe_account_id) {
      return res.status(200).json({ ok: true, created: false, accountId: existing.stripe_account_id });
    }

    const account = await stripe.accounts.create({
      type: 'express',
      email: email || undefined,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      metadata: {
        tenant_id: tenantId,
      },
    });

    await upsertConnectAccount({
      tenantId,
      stripeAccountId: account.id,
      chargesEnabled: account.charges_enabled ?? false,
      payoutsEnabled: account.payouts_enabled ?? false,
      detailsSubmitted: account.details_submitted ?? false,
      currentlyDue: account.requirements?.currently_due ?? [],
      eventuallyDue: account.requirements?.eventually_due ?? [],
      defaultCurrency: account.default_currency ?? 'BRL',
      disabledReason: account.requirements?.disabled_reason ?? null,
    });

    return res.status(200).json({ ok: true, created: true, accountId: account.id });
  } catch (error: any) {
    return res.status(500).json({ ok: false, error: 'stripe_account_create_failed', detail: error?.message ?? 'unexpected_error' });
  }
}
```

## Arquivo `api/payments/connect/onboarding-link.ts`

```ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { stripe, getAppUrl } from '../_lib/stripe';
import { findConnectAccountByTenant } from '../_lib/connect-store';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }

  try {
    const { tenantId, accountId } = req.body ?? {};
    if (!tenantId) {
      return res.status(400).json({ ok: false, error: 'missing_tenant_id' });
    }

    const existing = await findConnectAccountByTenant(tenantId);
    const resolvedAccountId = accountId || existing?.stripe_account_id;

    if (!resolvedAccountId) {
      return res.status(404).json({ ok: false, error: 'connect_account_not_found' });
    }

    const appUrl = getAppUrl();
    const link = await stripe.accountLinks.create({
      account: resolvedAccountId,
      refresh_url: `${appUrl}/api/payments/connect/refresh?tenantId=${encodeURIComponent(tenantId)}`,
      return_url: `${appUrl}/api/payments/connect/return?tenantId=${encodeURIComponent(tenantId)}`,
      type: 'account_onboarding',
    });

    return res.status(200).json({ ok: true, url: link.url });
  } catch (error: any) {
    return res.status(500).json({ ok: false, error: 'stripe_onboarding_link_failed', detail: error?.message ?? 'unexpected_error' });
  }
}
```
