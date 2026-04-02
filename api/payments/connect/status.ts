import type { VercelRequest, VercelResponse } from '@vercel/node';
import { stripe } from '../_lib/stripe.js';
import { findConnectAccountByTenant, upsertConnectAccount } from '../_lib/connect-store.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }

  try {
    const { tenantId } = (req.body || {}) as { tenantId?: string };
    if (!tenantId) {
      return res.status(400).json({ ok: false, error: 'missing_tenant_id' });
    }

    const existing = await findConnectAccountByTenant(tenantId);
    if (!existing) {
      return res.status(404).json({ ok: false, error: 'connect_account_not_found' });
    }

    const account = await stripe.accounts.retrieve(existing.stripe_account_id);
    const updated = await upsertConnectAccount({
      tenantId,
      stripeAccountId: account.id,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
      currentlyDue: account.requirements?.currently_due || [],
      eventuallyDue: account.requirements?.eventually_due || [],
      defaultCurrency: account.default_currency || 'BRL',
      disabledReason: account.requirements?.disabled_reason || null,
    });

    return res.status(200).json({ ok: true, status: updated.status, details: updated });
  } catch (error: any) {
    console.error('[STRIPE-CONNECT-STATUS]', error);
    return res.status(500).json({ 
      ok: false, 
      error: 'connect_status_sync_failed', 
      detail: error?.message ?? 'unexpected_error' 
    });
  }
}
