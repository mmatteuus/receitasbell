import type { VercelRequest, VercelResponse } from '@vercel/node';
import { stripe } from '../_lib/stripe.js';
import { findConnectAccountByTenant, upsertConnectAccount } from '../_lib/connect-store.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }

  try {
    const { tenantId, email } = (req.body || {}) as { tenantId?: string; email?: string };
    if (!tenantId) {
      return res.status(400).json({ ok: false, error: 'missing_tenant_id' });
    }

    const existing = await findConnectAccountByTenant(tenantId);
    if (existing) {
      return res.status(200).json({ ok: true, accountId: existing.stripe_account_id, existing: true });
    }

    const account = await stripe.accounts.create({
      type: 'standard',
      email: email || undefined,
      metadata: { tenant_id: tenantId },
    });

    await upsertConnectAccount({
      tenantId,
      stripeAccountId: account.id,
      chargesEnabled: false,
      payoutsEnabled: false,
      detailsSubmitted: false,
      currentlyDue: [],
      eventuallyDue: [],
      defaultCurrency: 'BRL',
    });

    return res.status(201).json({ ok: true, accountId: account.id, existing: false });
  } catch (error) {
    console.error('[STRIPE-CONNECT-ACCOUNT]', error);
    return res.status(500).json({ 
      ok: false, 
      error: 'connect_account_creation_failed', 
      detail: error instanceof Error ? error.message : 'unexpected_error' 
    });
  }
}
