import { mpGetPaymentMethods } from "./client.js";
import { getUsableMercadoPagoAccessToken } from "./connections.js";

export type SellerPaymentMethods = {
  pixEnabled: boolean;
  cardEnabled: boolean;
  creditEnabled: boolean;
  debitEnabled: boolean;
  rawMethods: string[];
};

/**
 * Consulta o catálogo de meios de pagamento real da conta conectada no Mercado Pago.
 * Isso permite que o frontend saiba se deve oferecer PIX ou Cartão (crédito/débito)
 * com base no que o seller realmente configurou na conta dele.
 */
export async function getTenantSellerPaymentMethods(tenantId: string | number): Promise<SellerPaymentMethods> {
  const { accessToken } = await getUsableMercadoPagoAccessToken(String(tenantId));
  const methods = await mpGetPaymentMethods(accessToken);

  // Filtramos apenas os métodos que o produto aceita (PIX e Cartão)
  const activeMethods = methods.filter((m) => m.status === "active");
  
  const normalized = activeMethods.map((m) => ({
    id: String(m.id || "").toLowerCase(),
    paymentTypeId: String(m.payment_type_id || "").toLowerCase(),
  }));

  const pixEnabled = normalized.some((m) => m.id === "pix");
  const creditEnabled = normalized.some((m) => m.paymentTypeId === "credit_card");
  const debitEnabled = normalized.some((m) => m.paymentTypeId === "debit_card");
  const cardEnabled = creditEnabled || debitEnabled;

  return {
    pixEnabled,
    cardEnabled,
    creditEnabled,
    debitEnabled,
    rawMethods: normalized.map((m) => m.id),
  };
}
