import type { PaymentStatus } from "@/types/payment";

export function resolveCheckoutResultPath(status: PaymentStatus) {
  if (status === "approved") return "/compra/sucesso";
  if (status === "pending" || status === "in_process") return "/compra/pendente";
  return "/compra/falha";
}
