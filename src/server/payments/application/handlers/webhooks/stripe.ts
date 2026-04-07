import { buffer, withApiHandler } from '../../../../shared/http.js';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { stripeClient } from '../../../providers/stripe/client.js';
import type Stripe from 'stripe';
import { env } from '../../../../shared/env.js';
import { supabaseAdmin } from '../../../../integrations/supabase/client.js';
import {
  updatePaymentOrderInternal,
  updatePaymentOrderStatus,
  getPaymentOrderById,
} from '../../../repo.js';
import { upsertConnectAccount } from '../../../repo/accounts.js';
import type { Logger } from '../../../../shared/logger.js';

function normalizeEmail(value: string | undefined | null) {
  return value?.trim().toLowerCase() || '';
}

async function hasProcessedStripeEvent(tenantId: string, orderId: string, eventId: string) {
  const { data, error } = await supabaseAdmin
    .from('payment_events')
    .select('payload')
    .eq('tenant_id', tenantId)
    .eq('payment_order_id', orderId);

  if (error || !data) return false;

  return data.some((row) => {
    const payload = row.payload;
    return payload && typeof payload === 'object' && payload.eventId === eventId;
  });
}

async function recordStripeEvent(
  tenantId: string,
  orderId: string,
  event: Stripe.Event,
  session: Stripe.Checkout.Session
) {
  const { error } = await supabaseAdmin.from('payment_events').insert({
    tenant_id: tenantId,
    payment_order_id: orderId,
    event_type: event.type,
    payload: {
      eventId: event.id,
      livemode: event.livemode,
      sessionId: session.id,
      paymentStatus: session.payment_status || null,
    },
  });

  if (error) {
    throw error;
  }
}

async function grantEntitlementsFromOrder(
  tenantId: string,
  session: Stripe.Checkout.Session,
  order: Awaited<ReturnType<typeof getPaymentOrderById>>,
  logger: Logger
) {
  if (!order?.recipeIds || order.recipeIds.length === 0) return;

  const accessIdentity =
    normalizeEmail(order.payerEmail) ||
    normalizeEmail(session.customer_details?.email) ||
    normalizeEmail(session.customer_email) ||
    normalizeEmail(session.metadata?.payerEmail) ||
    (order.userId ? String(order.userId) : '');

  if (!accessIdentity) {
    logger.warn('stripe.webhook.entitlements_missing_identity', {
      paymentOrderId: order?.id || null,
      sessionId: session.id,
    });
    return;
  }

  for (const recipeId of order.recipeIds) {
    const { data: existing, error: existingError } = await supabaseAdmin
      .from('entitlements')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('payment_order_id', order.id)
      .eq('user_id', accessIdentity)
      .eq('recipe_id', recipeId)
      .maybeSingle();

    if (existingError) {
      logger.error('stripe.webhook.entitlement_lookup_failed', existingError);
      throw existingError;
    }

    if (existing?.id) {
      continue;
    }

    const { error: insertError } = await supabaseAdmin.from('entitlements').insert({
      tenant_id: tenantId,
      user_id: accessIdentity,
      recipe_id: recipeId,
      payment_order_id: order.id,
    });

    if (insertError) {
      logger.error('stripe.webhook.entitlement_insert_failed', insertError);
      throw insertError;
    }
  }
}

async function processCheckoutSessionEvent(
  session: Stripe.Checkout.Session,
  event: Stripe.Event,
  options: { expectedPaid: boolean; statusIfNotPaid?: 'failed' | 'pending' },
  logger: Logger
) {
  const orderId = session.client_reference_id;
  const tenantId = session.metadata?.tenantId;
  const providerPaymentId = (session.payment_intent as string) || session.id;

  if (!orderId || !tenantId) {
    logger.warn('stripe.webhook.missing_metadata', {
      sessionId: session.id,
      orderId: orderId ?? null,
      tenantId: tenantId ?? null,
    });
    return;
  }

  const order = await getPaymentOrderById(tenantId, orderId);
  if (!order) {
    logger.warn('stripe.webhook.order_not_found', {
      orderId,
      tenantId,
      sessionId: session.id,
    });
    return;
  }

  if (await hasProcessedStripeEvent(tenantId, orderId, event.id)) {
    logger.debug('stripe.webhook.duplicate_event_ignored', {
      tenantId,
      paymentOrderId: orderId,
      providerEventId: event.id,
    });
    return;
  }

  const scopedLogger = logger.withContext({
    tenantId,
    paymentOrderId: orderId,
    providerPaymentId,
  });

  const baseUpdate = {
    providerPaymentId,
    providerEventId: event.id,
    providerMetadata: {
      eventId: event.id,
      eventType: event.type,
      paymentStatus: session.payment_status || null,
      sessionId: session.id,
    },
  };

  if (!options.expectedPaid) {
    if (options.statusIfNotPaid && order.status !== options.statusIfNotPaid) {
      await updatePaymentOrderInternal(tenantId, orderId, {
        ...baseUpdate,
        status: options.statusIfNotPaid,
      });
      scopedLogger.debug('stripe.webhook.status_updated', {
        status: options.statusIfNotPaid,
      });
    } else {
      await updatePaymentOrderInternal(tenantId, orderId, baseUpdate);
    }

    await recordStripeEvent(tenantId, orderId, event, session);
    return;
  }

  if (session.payment_status !== 'paid') {
    if (options.statusIfNotPaid && order.status !== options.statusIfNotPaid) {
      await updatePaymentOrderInternal(tenantId, orderId, {
        ...baseUpdate,
        status: options.statusIfNotPaid,
      });
      scopedLogger.debug('stripe.webhook.status_updated', {
        status: options.statusIfNotPaid,
      });
    } else {
      await updatePaymentOrderInternal(tenantId, orderId, baseUpdate);
    }

    await recordStripeEvent(tenantId, orderId, event, session);
    return;
  }

  if (order.status !== 'approved') {
    await updatePaymentOrderStatus(tenantId, orderId, 'approved', providerPaymentId);
    await updatePaymentOrderInternal(tenantId, orderId, baseUpdate);
    scopedLogger.debug('stripe.webhook.status_updated', {
      status: 'approved',
    });
  } else {
    await updatePaymentOrderInternal(tenantId, orderId, baseUpdate);
  }

  await grantEntitlementsFromOrder(tenantId, session, order, scopedLogger);
  await recordStripeEvent(tenantId, orderId, event, session);
}

export default withApiHandler(async (req: VercelRequest, res: VercelResponse, { logger }) => {
  const baseLogger = logger.withContext({ provider: 'stripe' });

  if (req.method !== 'POST') {
    baseLogger.warn('stripe.webhook.method_not_allowed', { method: req.method });
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const webhookSecret = env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    baseLogger.error('stripe.webhook.secret_missing', new Error('STRIPE_WEBHOOK_SECRET missing'));
    res.status(500).send('Webhook Error: Missing Stripe webhook secret');
    return;
  }

  const signatureHeader = req.headers['stripe-signature'];
  const signature = Array.isArray(signatureHeader) ? signatureHeader[0] : signatureHeader;
  if (!signature) {
    baseLogger.warn('stripe.webhook.signature_missing', { reason: 'missing_signature' });
    res.status(400).send('Webhook Error: Missing Stripe signature');
    return;
  }

  let rawBody: Buffer;
  try {
    rawBody = await buffer(req);
  } catch (error: unknown) {
    baseLogger.error('stripe.webhook.body_read_failed', error);
    res.status(400).send('Webhook Error: Invalid payload');
    return;
  }

  if (!rawBody.length) {
    baseLogger.warn('stripe.webhook.empty_body', { reason: 'empty_payload' });
    res.status(400).send('Webhook Error: Empty payload');
    return;
  }

  let event: Stripe.Event;
  try {
    event = stripeClient.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    baseLogger.error('stripe.webhook.signature_invalid', err);
    res.status(400).send(`Webhook Error: ${errorMessage}`);
    return;
  }

  const eventLogger = baseLogger.withContext({
    providerEventId: event.id,
    action: `stripe.webhook.${event.type}`,
    eventType: event.type,
  });
  eventLogger.debug('stripe.webhook.received', {
    account: event.account ?? null,
    livemode: event.livemode,
  });

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    try {
      await processCheckoutSessionEvent(
        session,
        event,
        { expectedPaid: true, statusIfNotPaid: 'pending' },
        eventLogger
      );
    } catch (error: unknown) {
      eventLogger.error('stripe.webhook.checkout_failed', error);
      throw error;
    }
  }

  if (event.type === 'checkout.session.async_payment_succeeded') {
    const session = event.data.object as Stripe.Checkout.Session;
    try {
      await processCheckoutSessionEvent(session, event, { expectedPaid: true }, eventLogger);
    } catch (error: unknown) {
      eventLogger.error('stripe.webhook.checkout_failed', error);
      throw error;
    }
  }

  if (event.type === 'checkout.session.async_payment_failed') {
    const session = event.data.object as Stripe.Checkout.Session;
    try {
      await processCheckoutSessionEvent(
        session,
        event,
        { expectedPaid: false, statusIfNotPaid: 'failed' },
        eventLogger
      );
    } catch (error: unknown) {
      eventLogger.error('stripe.webhook.checkout_failed', error);
      throw error;
    }
  }

  if (event.type === 'account.updated') {
    const account = event.data.object as Stripe.Account;
    const tenantId = account.metadata?.tenantId;

    if (tenantId) {
      try {
        await upsertConnectAccount({
          tenantId,
          stripeAccountId: account.id,
          status: account.details_submitted ? 'ready' : 'pending',
          detailsSubmitted: account.details_submitted ?? false,
          chargesEnabled: account.charges_enabled ?? false,
          payoutsEnabled: account.payouts_enabled ?? false,
          defaultCurrency: account.default_currency ?? 'BRL',
          requirements: {
            currentlyDue: account.requirements?.currently_due || [],
            eventuallyDue: account.requirements?.eventually_due || [],
          },
          disabledReason: account.requirements?.disabled_reason || null,
        });
      } catch (error: unknown) {
        eventLogger.error('stripe.webhook.connect_sync_failed', error);
        throw error;
      }
    } else {
      eventLogger.warn('stripe.webhook.connect_missing_tenant', {
        stripeAccountId: account.id,
      });
    }
  }

  res.json({ received: true });
});
