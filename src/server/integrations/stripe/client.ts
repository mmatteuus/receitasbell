// src/server/integrations/stripe/client.ts
import Stripe from "stripe";
import { env } from "../../shared/env.js";

const STRIPE_TIMEOUT_MS = 15_000;

export class StripeApiError extends Error {
  status: number;
  code: string | undefined;
  constructor(status: number, message: string, code?: string) {
    super(message);
    this.name = "StripeApiError";
    this.status = status;
    this.code = code;
  }
}

export function normalizeStripeError(error: unknown) {
  if (!error || typeof error !== "object") {
    return { statusCode: 502, message: "Falha no Stripe.", code: undefined };
  }

  const record = error as Record<string, unknown>;
  return {
    statusCode: typeof record.statusCode === "number" ? record.statusCode : 502,
    message: typeof record.message === "string" ? record.message : "Falha no Stripe.",
    code: typeof record.code === "string" ? record.code : undefined,
  };
}

export function getStripeClient(): Stripe {
  const secretKey = env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new StripeApiError(500, "STRIPE_SECRET_KEY nao configurada.");
  return new Stripe(secretKey, {
    apiVersion: "2024-12-18.acacia" as Stripe.LatestApiVersion,
    timeout: STRIPE_TIMEOUT_MS,
    maxNetworkRetries: 2,
  });
}

export async function exchangeStripeOAuthCode(code: string): Promise<{
  accessToken: string;
  refreshToken: string | null;
  stripeAccountId: string;
  scope: string;
  livemode: boolean;
}> {
  const stripe = getStripeClient();
  let response: Stripe.OAuthToken;
  try {
    response = await stripe.oauth.token({ grant_type: "authorization_code", code });
  } catch (error: unknown) {
    const e = normalizeStripeError(error);
    throw new StripeApiError(e.statusCode, e.message, e.code);
  }
  if (!response.access_token || !response.stripe_user_id) {
    throw new StripeApiError(502, "Stripe OAuth nao retornou access_token ou stripe_user_id.");
  }
  return {
    accessToken: response.access_token,
    refreshToken: response.refresh_token ?? null,
    stripeAccountId: response.stripe_user_id,
    scope: response.scope ?? "",
    livemode: response.livemode ?? false,
  };
}

export async function createStripeCheckoutSession(input: {
  stripeAccountId: string;
  lineItems: Array<{
    priceData: { currency: string; productData: { name: string; images?: string[] }; unitAmount: number };
    quantity: number;
  }>;
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
  clientReferenceId: string;
  metadata?: Record<string, string>;
  applicationFeeAmount?: number;
  expiresAt?: number;
}): Promise<{ sessionId: string; url: string }> {
  const stripe = getStripeClient();
  const params: Stripe.Checkout.SessionCreateParams = {
    mode: "payment",
    line_items: input.lineItems.map((item) => ({
      price_data: {
        currency: item.priceData.currency,
        product_data: { name: item.priceData.productData.name, images: item.priceData.productData.images ?? [] },
        unit_amount: item.priceData.unitAmount,
      },
      quantity: item.quantity,
    })),
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    client_reference_id: input.clientReferenceId,
    metadata: input.metadata ?? {},
    expires_at: input.expiresAt ?? Math.floor(Date.now() / 1000) + 30 * 60,
  };
  if (input.customerEmail) params.customer_email = input.customerEmail;
  if (input.applicationFeeAmount && input.applicationFeeAmount > 0) {
    params.payment_intent_data = { application_fee_amount: input.applicationFeeAmount };
  }
  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.create(params, { stripeAccount: input.stripeAccountId });
  } catch (error: unknown) {
    const e = normalizeStripeError(error);
    throw new StripeApiError(e.statusCode, e.message, e.code);
  }
  if (!session.url) throw new StripeApiError(502, "Stripe nao retornou URL do checkout.");
  return { sessionId: session.id, url: session.url };
}

export async function getStripeCheckoutSession(
  sessionId: string,
  stripeAccountId: string,
): Promise<Stripe.Checkout.Session> {
  const stripe = getStripeClient();
  try {
    return await stripe.checkout.sessions.retrieve(sessionId, { stripeAccount: stripeAccountId });
  } catch (error: unknown) {
    const e = normalizeStripeError(error);
    throw new StripeApiError(e.statusCode, e.message, e.code);
  }
}

export function verifyStripeWebhookSignature(
  rawBody: Buffer | string,
  signature: string,
  webhookSecret: string,
): Stripe.Event {
  const stripe = getStripeClient();
  try {
    return stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error: unknown) {
    throw new StripeApiError(400, `Stripe webhook signature invalida: ${(error as Error).message}`);
  }
}
