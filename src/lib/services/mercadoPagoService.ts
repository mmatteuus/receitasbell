import type { CartItem } from '@/types/recipe';
import type { PaymentGateway, PaymentStatus } from '@/types/payment';
import { jsonFetch } from '@/lib/api/client';

export type CheckoutSessionInput = {
  items?: CartItem[];
  recipeIds?: string[];
  payerName?: string;
  payerEmail: string;
  checkoutReference: string;
};

export type CheckoutSessionResult = {
  gateway: PaymentGateway;
  paymentId: string | null;
  paymentIds: string[];
  status: PaymentStatus;
  unlockedCount: number;
  checkoutUrl: string | null;
};

export async function createCheckoutSession(input: CheckoutSessionInput) {
  const result = await jsonFetch<{
    payment: { id: string } | null;
    paymentId: string | null;
    paymentIds: string[];
    gateway?: PaymentGateway;
    status: PaymentStatus;
    unlockedCount: number;
    checkoutUrl?: string | null;
  }>('/api/checkout', {
    method: 'POST',
    body: {
      recipeIds: input.recipeIds || input.items?.map((item) => item.recipeId) || [],
      items: input.items,
      payerName: input.payerName,
      buyerEmail: input.payerEmail,
      checkoutReference: input.checkoutReference,
    },
  });

  return {
    gateway: result.gateway || 'mock',
    paymentId: result.paymentId ?? result.payment?.id ?? null,
    paymentIds: result.paymentIds,
    status: result.status,
    unlockedCount: result.unlockedCount,
    checkoutUrl: result.checkoutUrl ?? null,
  } satisfies CheckoutSessionResult;
}

export function resolveCheckoutResultPath(status: PaymentStatus) {
  if (status === 'approved') return '/compra/sucesso';
  if (status === 'pending' || status === 'in_process') return '/compra/pendente';
  return '/compra/falha';
}
