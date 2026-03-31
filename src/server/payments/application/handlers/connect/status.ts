import { stripeClient } from "../../../providers/stripe/client.js";
import { getConnectAccountByTenantId, upsertConnectAccount } from "../../../repo/accounts.js";
import { withApiHandler } from "../../../../shared/http.js";
import { requireTenantAdminSessionContext } from "../../../../auth/sessions.js";

/**
 * GET /api/payments/connect/status
 * Recupera e sincroniza o status da conta conectada do Stripe para o tenant atual.
 */
export default withApiHandler<void>(async (req, res, { logger }) => {
  // 1. Contexto de Sessão de Admin do Tenant
  const { tenant } = await requireTenantAdminSessionContext(req);

  logger.info("Verificando status de Stripe Connect", { tenantId: tenant.id });

  // 2. Busca no banco local
  const stored = await getConnectAccountByTenantId(tenant.id);

  if (!stored?.stripeAccountId) {
    logger.info("Tenant não possui conta conectada no momento.");
    res.status(200).json({ connected: false });
    return;
  }

  // 3. Sincroniza com o Stripe em tempo real (para admin)
  const stripeAccount = await stripeClient.accounts.retrieve(stored.stripeAccountId);

  // 4. Salva o status mais recente no banco
  const updated = await upsertConnectAccount({
    tenantId: tenant.id,
    stripeAccountId: stripeAccount.id,
    status: stripeAccount.details_submitted ? "ready" : "pending",
    detailsSubmitted: stripeAccount.details_submitted,
    chargesEnabled: stripeAccount.charges_enabled,
    payoutsEnabled: stripeAccount.payouts_enabled,
    defaultCurrency: stripeAccount.default_currency || "BRL",
    requirements: {
        currentlyDue: stripeAccount.requirements?.currently_due || [],
        eventuallyDue: stripeAccount.requirements?.eventually_due || [],
    }
  });

  logger.info("Conta sincronizada com sucesso.", { 
      stripeAccountId: updated.stripeAccountId,
      chargesEnabled: updated.chargesEnabled
  });

  res.status(200).json({
    connected: true,
    stripeAccountId: updated.stripeAccountId,
    status: updated.status,
    chargesEnabled: updated.chargesEnabled,
    payoutsEnabled: updated.payoutsEnabled,
    detailsSubmitted: updated.detailsSubmitted,
    requirements: updated.requirements,
    payoutsEnabledDetail: stripeAccount.payouts_enabled,
  });
});
