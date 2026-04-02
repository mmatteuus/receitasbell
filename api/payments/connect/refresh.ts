import type { VercelRequest, VercelResponse } from '@vercel/node';
import { stripe, getAppUrl } from '../_lib/stripe.js';
import { findConnectAccountByTenant } from '../_lib/connect-store.js';

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

    // Redireciona o usuário de volta para o fluxo do Stripe
    return res.redirect(303, link.url);
  } catch (error: any) {
    console.error('[STRIPE-CONNECT-REFRESH]', error);
    return res.status(500).json({ 
      ok: false, 
      error: 'stripe_refresh_failed', 
      detail: error?.message ?? 'unexpected_error' 
    });
  }
}
