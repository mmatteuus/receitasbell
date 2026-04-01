import { stripeClient } from '../../../providers/stripe/client.js';
import { getConnectAccountByTenantId, upsertConnectAccount } from '../../../repo/accounts.js';
import { withApiHandler } from '../../../../shared/http.js';
import { requireTenantAdminSessionContext } from '../../../../auth/sessions.js';
import { env } from '../../../../shared/env.js';

import type { VercelRequest, VercelResponse } from '@vercel/node';

function buildStripeRedirectUrl(result: 'success' | 'refresh') {
  return `${env.APP_BASE_URL}/admin/pagamentos/configuracoes?stripe=${result}`;
}

/**
 * POST /api/payments/connect/account
 * Cria ou retorna uma conta Stripe Connect para o tenant atual.
 */
export default withApiHandler(async (req: VercelRequest, res: VercelResponse, { logger }) => {
  // 1. Autenticação e Contexto de Tenant Admin
  const { tenant } = await requireTenantAdminSessionContext(req);

  logger.info('Solicitando conta Stripe Connect', { tenantId: tenant.id });

  // 2. Verifica se já existe uma conta
  const existing = await getConnectAccountByTenantId(tenant.id);
  if (existing?.stripeAccountId) {
    logger.info('Conta Stripe Connect já existe', { stripeAccountId: existing.stripeAccountId });
    const accountLinks = await stripeClient.accountLinks.create({
      account: existing.stripeAccountId,
      refresh_url: buildStripeRedirectUrl('refresh'),
      return_url: buildStripeRedirectUrl('success'),
      type: 'account_onboarding',
    });
    res.status(200).json({ accountId: existing.stripeAccountId, onboardingUrl: accountLinks.url });
    return;
  }

  // 3. Cria nova conta no Stripe
  const account = await stripeClient.accounts.create({
    type: 'standard',
    metadata: {
      tenantId: tenant.id,
    },
  });

  // 4. Persiste no banco de dados Supabase
  const newAccount = await upsertConnectAccount({
    tenantId: tenant.id,
    stripeAccountId: account.id,
    status: 'pending',
    detailsSubmitted: account.details_submitted,
    chargesEnabled: account.charges_enabled,
    payoutsEnabled: account.payouts_enabled,
    defaultCurrency: 'BRL',
  });

  const accountLinks = await stripeClient.accountLinks.create({
    account: newAccount.stripeAccountId,
    refresh_url: buildStripeRedirectUrl('refresh'),
    return_url: buildStripeRedirectUrl('success'),
    type: 'account_onboarding',
  });

  logger.info('Conta Stripe Connect criada com sucesso', { stripeAccountId: account.id });

  res.status(201).json({ accountId: newAccount.stripeAccountId, onboardingUrl: accountLinks.url });
});
