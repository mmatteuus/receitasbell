import type { CartItem } from "@/types/recipe";
import type { PaymentStatus } from "@/types/payment";
import { jsonFetch } from "@/lib/api/client";

export type CheckoutSessionInput = {
  items: CartItem[];
  payerName: string;
  payerEmail: string;
  checkoutReference: string;
};

export type CheckoutSessionResult = {
  paymentId: string | null;
  paymentIds: string[];
  status: PaymentStatus;
  unlockedCount: number;
};

export async function createCheckoutSession(input: CheckoutSessionInput) {
  const result = await jsonFetch<{
    payment: { id: string } | null;
    paymentId: string | null;
    paymentIds: string[];
    status: PaymentStatus;
    unlockedCount: number;
  }>("/api/checkout", {
    method: "POST",
    body: {
      recipeIds: input.items.map((item) => item.recipeId),
      items: input.items,
      payerName: input.payerName,
      buyerEmail: input.payerEmail,
      checkoutReference: input.checkoutReference,
    },
  });

  return {
    paymentId: result.paymentId ?? result.payment?.id ?? null,
    paymentIds: result.paymentIds,
    status: result.status,
    unlockedCount: result.unlockedCount,
  } satisfies CheckoutSessionResult;
}

export function resolveCheckoutResultPath(status: PaymentStatus) {
  if (status === "approved") return "/compra/sucesso";
  if (status === "pending" || status === "in_process") return "/compra/pendente";
  return "/compra/falha";
}
