import { stripeClient } from '../../../providers/stripe/client.js';
import { env } from '../../../../shared/env.js';
import { getConnectAccountByTenantId } from '../../../repo/accounts.js';
import { withApiHandler } from '../../../../shared/http.js';
import { requireTenantAdminSessionContext } from '../../../../auth/sessions.js';

import type { VercelRequest, VercelResponse } from '@vercel/node';

function buildStripeRedirectUrl(result: 'success' | 'refresh') {
  return `${env.APP_BASE_URL}/admin/pagamentos/configuracoes?stripe=${result}`;
}

/**
 * POST /api/payments/connect/onboarding-link
 * Cria um link de onboarding (Stripe Connect) para o tenant logado.
 */
export default withApiHandler(async (req: VercelRequest, res: VercelResponse, { logger }) => {
  // 1. Extração do contexto de tenant do admin
  const { tenant } = await requireTenantAdminSessionContext(req);

  logger.info('Solicitando link de onboarding Stripe', { tenantId: tenant.id });

  // 2. Localiza a conta Stripe Connect para este tenant
  const account = await getConnectAccountByTenantId(tenant.id);

  if (!account?.stripeAccountId) {
    res.status(404).json({
      error:
        'Conta Stripe Connect não encontrada para este tenant. Crie a conta primeiro em /connect/account.',
    });
    return;
  }

  // 3. Cria o link de onboarding via Stripe
  const accountLinks = await stripeClient.accountLinks.create({
    account: account.stripeAccountId,
    refresh_url: buildStripeRedirectUrl('refresh'),
    return_url: buildStripeRedirectUrl('success'),
    type: 'account_onboarding',
  });

  logger.info('Link de onboarding criado com sucesso', {
    tenantId: tenant.id,
    stripeAccountId: account.stripeAccountId,
  });

  res.status(200).json({ onboardingUrl: accountLinks.url });
});
