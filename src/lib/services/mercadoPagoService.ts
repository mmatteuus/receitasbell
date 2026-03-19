import type { CartItem } from '@/types/recipe';
import type {
  CreatePaymentPreferenceInput,
  CreatePaymentPreferenceResult,
  PaymentStatus,
} from '@/types/payment';
import { createMercadoPagoPreference } from '@/lib/api/payments';

export type CheckoutSessionInput = Omit<CreatePaymentPreferenceInput, 'recipeIds'> & {
  recipeIds?: string[];
};

export type CheckoutSessionResult = CreatePaymentPreferenceResult;

export async function createCheckoutSession(input: CheckoutSessionInput) {
  return createMercadoPagoPreference({
    recipeIds: input.recipeIds || input.items?.map((item) => item.recipeId) || [],
    items: input.items as CartItem[] | undefined,
    payerName: input.payerName,
    payerEmail: input.payerEmail,
    checkoutReference: input.checkoutReference,
  });
}

export function resolveCheckoutResultPath(status: PaymentStatus) {
  if (status === 'approved') return '/compra/sucesso';
  if (status === 'pending' || status === 'in_process') return '/compra/pendente';
  return '/compra/falha';
}
