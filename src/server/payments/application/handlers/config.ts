import type { VercelRequest, VercelResponse } from "@vercel/node";

/** Config de checkout — legado Mercado Pago, desativado após migração para Stripe Checkout Sessions */
export default async function handler(_request: VercelRequest, response: VercelResponse) {
  return response.status(410).json({
    error: "gone",
    message: "Este endpoint foi desativado. Use /api/payments/checkout/session para criar uma sessão do Stripe.",
  });
}
