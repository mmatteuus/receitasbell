import type { VercelRequest, VercelResponse } from "@vercel/node";

/** Endpoint legado de PIX via Mercado Pago — desativado após migração para Stripe */
export default async function handler(_request: VercelRequest, response: VercelResponse) {
  return response.status(410).json({
    error: "gone",
    message: "Este endpoint foi desativado. Os pagamentos agora são processados via Stripe Checkout.",
  });
}
