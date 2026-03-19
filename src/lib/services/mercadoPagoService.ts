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

export async function createPreference(input: CheckoutSessionInput) {
  return createMercadoPagoPreference({
    recipeIds: input.recipeIds || input.items?.map((item) => item.recipeId) || [],
    items: input.items as CartItem[] | undefined,
    payerName: input.payerName,
    payerEmail: input.payerEmail,
    checkoutReference: input.checkoutReference,
  });
}

export async function createCheckoutSession(input: CheckoutSessionInput) {
  return createPreference(input);
}

export function getPayment(paymentId: string) {
  return {
    id: paymentId,
  };
}

export function parseWebhook(payload: Record<string, unknown>) {
  return {
    id:
      payload?.data && typeof payload.data === "object" && "id" in payload.data
        ? String((payload.data as { id?: unknown }).id ?? "")
        : String(payload.id ?? ""),
    topic: String(payload.type ?? payload.topic ?? "payment"),
  };
}

export function normalizeStatus(status: string | null | undefined): PaymentStatus {
  if (status === 'approved') return 'approved';
  if (status === 'pending') return 'pending';
  if (status === 'in_process') return 'in_process';
  if (status === 'rejected') return 'rejected';
  if (status === 'cancelled' || status === 'cancelled_by_user') return 'cancelled';
  if (status === 'refunded') return 'refunded';
  if (status === 'charged_back') return 'charged_back';
  return 'pending';
}

export function resolveCheckoutResultPath(status: PaymentStatus) {
  if (status === 'approved') return '/compra/sucesso';
  if (status === 'pending' || status === 'in_process') return '/compra/pendente';
  return '/compra/falha';
}
