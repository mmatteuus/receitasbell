import type { VercelRequest } from '@vercel/node';
import { createHmac, timingSafeEqual } from 'node:crypto';
import type { CartItem } from '../../types/cart.js';
import { ApiError } from '../http.js';
import { getMercadoPagoEnv } from '../env.js';

type MercadoPagoPreferencePayload = {
  external_reference: string;
  items: Array<{
    id: string;
    title: string;
    description: string;
    picture_url?: string;
    quantity: number;
    currency_id: 'BRL';
    unit_price: number;
  }>;
  payer: {
    email: string;
  };
  back_urls: {
    success: string;
    pending: string;
    failure: string;
  };
  auto_return: 'approved';
  metadata: Record<string, unknown>;
  notification_url?: string;
};

type MercadoPagoPreferenceResponse = {
  id?: string;
  init_point?: string;
  sandbox_init_point?: string;
  [key: string]: unknown;
};

type MercadoPagoSignatureParts = {
  ts: string;
  v1: string;
};

function asSingleHeader(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function roundCurrency(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function parseSignatureHeader(header: string) {
  const parts = header
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((acc, part) => {
      const [rawKey, ...rawValue] = part.split('=');
      if (!rawKey || !rawValue.length) {
        return acc;
      }

      acc[rawKey.trim()] = rawValue.join('=').trim();
      return acc;
    }, {});

  const ts = parts.ts;
  const v1 = parts.v1;
  if (!ts || !v1) {
    throw new ApiError(400, 'Malformed Mercado Pago signature header');
  }

  return { ts, v1 } satisfies MercadoPagoSignatureParts;
}

function buildPreferenceItems(items: CartItem[]) {
  return items.map((item) => ({
    id: item.recipeId,
    title: item.title,
    description: `Acesso digital à receita ${item.title}`,
    picture_url: item.imageUrl || undefined,
    quantity: 1,
    currency_id: 'BRL' as const,
    unit_price: roundCurrency(item.priceBRL),
  }));
}

function signaturesMatch(expected: string, received: string) {
  try {
    return timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(received, 'hex'));
  } catch {
    return false;
  }
}

export function buildMercadoPagoWebhookManifest(paymentId: string, requestId: string, ts: string) {
  return `id:${paymentId};request-id:${requestId};ts:${ts};`;
}

export function verifyMercadoPagoWebhookSignature(
  paymentId: string,
  requestId: string,
  signature: MercadoPagoSignatureParts
) {
  const { webhookSecret } = getMercadoPagoEnv();
  const manifest = buildMercadoPagoWebhookManifest(paymentId, requestId, signature.ts);
  const digest = createHmac('sha256', webhookSecret).update(manifest).digest('hex');
  return signaturesMatch(digest, signature.v1.toLowerCase());
}

export function assertMercadoPagoWebhookSignature(request: VercelRequest, paymentId: string) {
  const signatureHeader = asSingleHeader(request.headers['x-signature']);
  const requestId = asSingleHeader(request.headers['x-request-id']);

  if (!signatureHeader || !requestId) {
    throw new ApiError(401, 'Missing Mercado Pago webhook signature headers');
  }

  const signature = parseSignatureHeader(signatureHeader);
  if (!verifyMercadoPagoWebhookSignature(paymentId, requestId, signature)) {
    throw new ApiError(401, 'Invalid Mercado Pago webhook signature');
  }
}

export async function createMercadoPagoPreference(input: {
  items: CartItem[];
  buyerEmail: string;
  externalReference: string;
  successUrl: string;
  pendingUrl: string;
  failureUrl: string;
  notificationUrl?: string;
  metadata: Record<string, unknown>;
}) {
  const { accessToken } = getMercadoPagoEnv();
  const payload: MercadoPagoPreferencePayload = {
    external_reference: input.externalReference,
    items: buildPreferenceItems(input.items),
    payer: {
      email: input.buyerEmail,
    },
    back_urls: {
      success: input.successUrl,
      pending: input.pendingUrl,
      failure: input.failureUrl,
    },
    auto_return: 'approved',
    metadata: input.metadata,
  };

  if (input.notificationUrl) {
    payload.notification_url = input.notificationUrl;
  }

  const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const body = (await response.json().catch(() => null)) as MercadoPagoPreferenceResponse | null;
  if (!response.ok) {
    throw new ApiError(
      502,
      'Mercado Pago preference creation failed',
      body ?? { status: response.status }
    );
  }

  const initPoint = typeof body?.init_point === 'string' ? body.init_point : null;
  if (!initPoint) {
    throw new ApiError(502, 'Mercado Pago preference did not return init_point', body);
  }

  return {
    preferenceId: typeof body?.id === 'string' ? body.id : null,
    initPoint,
    sandboxInitPoint: typeof body?.sandbox_init_point === 'string' ? body.sandbox_init_point : null,
    raw: body ?? {},
  };
}
