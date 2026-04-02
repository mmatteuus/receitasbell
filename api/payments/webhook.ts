import type { VercelRequest, VercelResponse } from '@vercel/node';
import type Stripe from 'stripe';
import { stripe } from './_lib/stripe.js';
import { upsertConnectAccount } from './_lib/connect-store.js';

// Desabilita o body-parser automático da Vercel para permitir a validação de assinatura (raw body)
export const config = {
  api: {
    bodyParser: false,
  },
};

/**
 * Utility function to read the raw body from the request stream
 */
function getRawBody(req: VercelRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }

  const signature = req.headers['stripe-signature'];
  if (!signature || Array.isArray(signature)) {
    return res.status(400).json({ ok: false, error: 'missing_signature' });
  }

  try {
    const rawBody = await getRawBody(req);
    const event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET as string,
    );

    // Processa somente o evento de atualização de conta conectada
    if (event.type === 'account.updated') {
      const account = event.data.object as Stripe.Account;
      
      // O tenant_id deve estar nos metadados da conta para sabermos de quem é
      const tenantId = String(account.metadata?.tenant_id || '');

      if (tenantId) {
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
      }
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('[STRIPE-WEBHOOK]', error);
    return res.status(400).json({ 
      ok: false, 
      error: 'invalid_webhook', 
      detail: error instanceof Error ? error.message : 'unexpected_error' 
    });
  }
}
