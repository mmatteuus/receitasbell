/**
 * TASK-003 — Catálogo dinâmico de meios de pagamento do seller conectado.
 *
 * Consulta /v1/payment_methods da conta MP conectada e retorna um snapshot
 * normalizado, contendo apenas os métodos permitidos pelo produto (PIX, cartão de
 * crédito e cartão de débito). Ticket, boleto, bank_transfer e account_money são
 * explicitamente excluídos para cumprir a regra de produto definida na auditoria.
 */

import { mpFetchPaymentMethods, type MercadoPagoPaymentMethod } from "./client.js";

/** Tipos de pagamento aceitos pelo produto. */
const ALLOWED_PAYMENT_TYPES = new Set(["pix", "credit_card", "debit_card"]);

/** Tipos de pagamento explicitamente proibidos (independente da conta). */
const BLOCKED_PAYMENT_TYPES = new Set([
  "ticket",
  "atm",
  "bank_transfer",
  "account_money",
  "consumer_credits",
]);

export type SellerPaymentMethodSnapshot = {
  /** O seller aceita PIX. */
  pixEnabled: boolean;
  /** O seller aceita cartão (crédito ou débito). */
  cardEnabled: boolean;
  /** O seller aceita cartão de crédito especificamente. */
  creditEnabled: boolean;
  /** O seller aceita cartão de débito especificamente. */
  debitEnabled: boolean;
};

function isMethodAllowed(method: MercadoPagoPaymentMethod): boolean {
  const paymentType = String(method.payment_type_id || "").toLowerCase();
  if (BLOCKED_PAYMENT_TYPES.has(paymentType)) return false;
  return ALLOWED_PAYMENT_TYPES.has(paymentType);
}

/**
 * Obtém o catálogo de meios de pagamento suportados pelo seller conectado.
 * Usa o accessToken já resolvido (não chama getUsableMercadoPagoAccessToken
 * para evitar dependência circular).
 */
export async function getSellerPaymentMethodSnapshot(
  accessToken: string,
): Promise<SellerPaymentMethodSnapshot> {
  let methods: MercadoPagoPaymentMethod[] = [];

  try {
    methods = await mpFetchPaymentMethods(accessToken);
  } catch {
    // Se falhar, assume suporte mínimo (PIX apenas) para não bloquear o checkout.
    return { pixEnabled: true, cardEnabled: false, creditEnabled: false, debitEnabled: false };
  }

  const allowed = methods.filter(isMethodAllowed);
  const normalized = allowed.map((m) => ({
    id: String(m.id || "").toLowerCase(),
    paymentTypeId: String(m.payment_type_id || "").toLowerCase(),
  }));

  return {
    pixEnabled: normalized.some((m) => m.id === "pix" || m.paymentTypeId === "pix"),
    cardEnabled: normalized.some(
      (m) => m.paymentTypeId === "credit_card" || m.paymentTypeId === "debit_card",
    ),
    creditEnabled: normalized.some((m) => m.paymentTypeId === "credit_card"),
    debitEnabled: normalized.some((m) => m.paymentTypeId === "debit_card"),
  };
}

/**
 * Snapshot seguro (sem lançar exceção) para uso em rotas críticas.
 * Em caso de falha de conexão com o MP, assume apenas PIX disponível.
 */
export async function getSellerPaymentMethodSnapshotSafe(
  accessToken: string | null | undefined,
): Promise<SellerPaymentMethodSnapshot> {
  if (!accessToken) {
    return { pixEnabled: true, cardEnabled: false, creditEnabled: false, debitEnabled: false };
  }

  try {
    return await getSellerPaymentMethodSnapshot(accessToken);
  } catch {
    return { pixEnabled: true, cardEnabled: false, creditEnabled: false, debitEnabled: false };
  }
}
