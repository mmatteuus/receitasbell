import { withApiHandler } from '../../../../shared/http.js';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { stripeClient } from '../../../providers/stripe/client.js';
import { supabaseAdmin } from '../../../../integrations/supabase/client.js';
import { env } from '../../../../shared/env.js';
import { getRecipeById, getRecipeBySlug } from '../../../../recipes/repo.js';
import { createPaymentOrder, updatePaymentOrderInternal } from '../../../repo.js';
import type { CartItem } from '../../../../../types/cart.js';
import { requireTenantFromRequest } from '../../../../tenancy/resolver.js';

function detectPaymentMode(secretKey: string | undefined) {
  return secretKey?.startsWith('sk_live_') ? 'production' : 'sandbox';
}

export default withApiHandler(async (req: VercelRequest, res: VercelResponse, { logger }) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { tenant } = await requireTenantFromRequest(req);
  const body = (req.body ?? {}) as {
    recipeSlug?: string;
    recipeIds?: string[];
    userId?: string;
    payerEmail?: string;
    payerName?: string;
    checkoutReference?: string;
  };
  const recipeSlug = body.recipeSlug;
  const userId = body.userId || body.payerEmail;

  if (!recipeSlug || !userId) {
    res.status(400).json({ error: 'Missing required parameters (recipeSlug, payerEmail/userId)' });
    return;
  }

  const recipe =
    (await getRecipeBySlug(tenant.id, recipeSlug)) ??
    (body.recipeIds?.length === 1 ? await getRecipeById(tenant.id, body.recipeIds[0]) : null);
  if (!recipe || recipe.accessTier !== 'paid' || !recipe.priceBRL) {
    res.status(400).json({ error: 'Recipe invalid or free tier.' });
    return;
  }

  const { data: storedAccount } = await supabaseAdmin
    .from('stripe_connect_accounts')
    .select('stripe_account_id')
    .eq('tenant_id', tenant.id)
    .maybeSingle();

  if (!storedAccount?.stripe_account_id) {
    res.status(400).json({ error: 'Tenant does not have an active Stripe integration.' });
    return;
  }

  const orderId = crypto.randomUUID();
  const amountCents = Math.round(recipe.priceBRL * 100);

  const order = await createPaymentOrder(tenant.id, {
    userId,
    recipeIds: [recipe.id],
    amount: amountCents,
    currency: 'BRL',
    status: 'pending',
    provider: 'stripe',
    externalReference: orderId,
    idempotencyKey: orderId,
    payerEmail: userId,
    paymentMethod: 'stripe_checkout',
    items: [
      {
        recipeId: recipe.id,
        title: recipe.title,
        priceBRL: recipe.priceBRL,
        slug: recipe.slug,
        imageUrl: recipe.imageUrl ?? null,
        quantity: 1,
      } satisfies CartItem,
    ],
  });

  const applicationFeeAmount = Math.round(amountCents * 0.1);

  const session = await stripeClient.checkout.sessions.create({
    payment_method_types: ['card', 'pix'],
    line_items: [
      {
        price_data: {
          currency: 'brl',
          unit_amount: amountCents,
          product_data: {
            name: recipe.title,
            images: recipe.imageUrl ? [recipe.imageUrl] : [],
            metadata: { recipeId: recipe.id },
          },
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: `${env.APP_BASE_URL}/recipes/${recipe.slug}?payment=success&orderId=${order.id}`,
    cancel_url: `${env.APP_BASE_URL}/recipes/${recipe.slug}?payment=cancel`,
    client_reference_id: order.id,
    payment_intent_data: {
      application_fee_amount: applicationFeeAmount,
      transfer_data: {
        destination: storedAccount.stripe_account_id,
      },
    },
    metadata: {
      tenantId: tenant.id,
      userId,
      payerName: body.payerName || '',
      recipeId: recipe.id,
      orderId: order.id,
    },
  });

  await updatePaymentOrderInternal(tenant.id, order.id, {
    providerPaymentId: session.id,
  });

  res.status(200).json({
    paymentOrderId: order.id,
    orderId: order.id,
    preferenceId: null,
    checkoutUrl: session.url,
    checkoutUrlKind: null,
    paymentMode: detectPaymentMode(env.STRIPE_SECRET_KEY),
    paymentId: session.id,
    paymentIds: [session.id],
    status: order.status,
    unlockedCount: 0,
    gateway: 'stripe',
    sessionId: session.id,
  });
});
