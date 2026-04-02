# Código de Endpoints — Status, Refresh e Return

Assinatura: Desenvolvido por MtsFerreira — https://mtsferreira.dev

## Arquivo `api/payments/connect/status.ts`

```ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { stripe } from '../_lib/stripe';
import { findConnectAccountByTenant, upsertConnectAccount } from '../_lib/connect-store';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }

  try {
    const tenantId = String(req.query.tenantId || '');
    if (!tenantId) {
      return res.status(400).json({ ok: false, error: 'missing_tenant_id' });
    }

    const existing = await findConnectAccountByTenant(tenantId);
    if (!existing?.stripe_account_id) {
      return res.status(404).json({ ok: false, error: 'connect_account_not_found' });
    }

    const account = await stripe.accounts.retrieve(existing.stripe_account_id);
    const synced = await upsertConnectAccount({
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

    return res.status(200).json({ ok: true, data: synced });
  } catch (error: any) {
    return res.status(500).json({ ok: false, error: 'stripe_connect_status_failed', detail: error?.message ?? 'unexpected_error' });
  }
}
```

## Arquivo `api/payments/connect/refresh.ts`

```ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { stripe, getAppUrl } from '../_lib/stripe';
import { findConnectAccountByTenant } from '../_lib/connect-store';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }

  try {
    const tenantId = String(req.query.tenantId || '');
    if (!tenantId) {
      return res.status(400).json({ ok: false, error: 'missing_tenant_id' });
    }

    const existing = await findConnectAccountByTenant(tenantId);
    if (!existing?.stripe_account_id) {
      return res.status(404).json({ ok: false, error: 'connect_account_not_found' });
    }

    const appUrl = getAppUrl();
    const link = await stripe.accountLinks.create({
      account: existing.stripe_account_id,
      refresh_url: `${appUrl}/api/payments/connect/refresh?tenantId=${encodeURIComponent(tenantId)}`,
      return_url: `${appUrl}/api/payments/connect/return?tenantId=${encodeURIComponent(tenantId)}`,
      type: 'account_onboarding',
    });

    return res.redirect(303, link.url);
  } catch (error: any) {
    return res.status(500).json({ ok: false, error: 'stripe_refresh_failed', detail: error?.message ?? 'unexpected_error' });
  }
}
```

## Arquivo `api/payments/connect/return.ts`

```ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { stripe, getAppUrl } from '../_lib/stripe';
import { findConnectAccountByTenant, upsertConnectAccount } from '../_lib/connect-store';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }

  try {
    const tenantId = String(req.query.tenantId || '');
    if (!tenantId) {
      return res.status(400).json({ ok: false, error: 'missing_tenant_id' });
    }

    const existing = await findConnectAccountByTenant(tenantId);
    if (!existing?.stripe_account_id) {
      return res.status(404).json({ ok: false, error: 'connect_account_not_found' });
    }

    const account = await stripe.accounts.retrieve(existing.stripe_account_id);
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

    return res.redirect(303, `${getAppUrl()}/admin/pagamentos/configuracoes?stripe=returned`);
  } catch (error: any) {
    return res.status(500).json({ ok: false, error: 'stripe_return_sync_failed', detail: error?.message ?? 'unexpected_error' });
  }
}
```
