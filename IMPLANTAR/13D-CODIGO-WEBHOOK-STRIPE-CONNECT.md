# Código de Webhook — Stripe Connect

Assinatura: Desenvolvido por MtsFerreira — https://mtsferreira.dev

## Arquivo `api/payments/webhook.ts`

```ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { stripe } from './_lib/stripe';
import { upsertConnectAccount } from './_lib/connect-store';

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

    if (event.type === 'account.updated') {
      const account = event.data.object as any;
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
  } catch (error: any) {
    return res.status(400).json({ ok: false, error: 'invalid_webhook', detail: error?.message ?? 'unexpected_error' });
  }
}
```

## Observação obrigatória

Se o projeto atual usar body parser automático que impeça o raw body do webhook, desabilitar parsing automático apenas neste endpoint.

Objetivo:
- validar assinatura do Stripe
- processar `account.updated`
- manter `public.stripe_connect_accounts` sincronizada
