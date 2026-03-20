import type { VercelRequest } from '@vercel/node';
import type { CartItem } from '../../types/cart.js';
import { ApiError } from '../http.js';
import { getMercadoPagoEnv } from '../env.js';
export {
  assertMercadoPagoWebhookSignature,
  buildMercadoPagoWebhookManifest,
  verifyMercadoPagoWebhookSignature,
} from '../mercadopago/webhooks.js';

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

function asSingleHeader(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function roundCurrency(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
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
  const { accessToken } = await getMercadoPagoEnv();
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
