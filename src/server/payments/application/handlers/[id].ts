import type { VercelRequest, VercelResponse } from "@vercel/node";

/** Consulta de status de pagamento — legado Mercado Pago, use /api/payments/connect/status para Stripe */
export default async function handler(_request: VercelRequest, response: VercelResponse) {
  return response.status(410).json({
    error: "gone",
    message: "Este endpoint foi desativado. Use a API do Stripe para consultar cobranças.",
  });
}
