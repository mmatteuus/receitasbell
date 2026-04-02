import type { VercelRequest, VercelResponse } from '@vercel/node';
import { stripe, getAppUrl } from '../_lib/stripe.js';
import { findConnectAccountByTenant, upsertConnectAccount } from '../_lib/connect-store.js';

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

    // Ao retornar, precisamos consultar o estado final no Stripe e atualizar o banco
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

    // Redirecionamento final ao painel administrativo
    return res.redirect(303, `${getAppUrl()}/admin/pagamentos/configuracoes?stripe=returned`);
  } catch (error) {
    console.error('[STRIPE-CONNECT-RETURN]', error);
    return res.status(500).json({ 
      ok: false, 
      error: 'stripe_return_sync_failed', 
      detail: error instanceof Error ? error.message : 'unexpected_error' 
    });
  }
}
