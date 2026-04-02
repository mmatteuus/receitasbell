import type { VercelRequest, VercelResponse } from '@vercel/node';
import { stripe, getAppUrl } from '../_lib/stripe.js';
import { findConnectAccountByTenant } from '../_lib/connect-store.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }

  try {
    const { tenantId, accountId } = (req.body || {}) as { tenantId?: string; accountId?: string };
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
    console.error('[STRIPE-CONNECT-ONBOARDING]', error);
    return res.status(500).json({ 
      ok: false, 
      error: 'stripe_onboarding_link_failed', 
      detail: error?.message ?? 'unexpected_error' 
    });
  }
}
