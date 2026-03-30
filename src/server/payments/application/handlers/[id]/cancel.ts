import type { VercelRequest, VercelResponse } from "@vercel/node";

/** Cancelamento de pagamento — legado MP, desativado após migração para Stripe */
export default async function handler(_request: VercelRequest, response: VercelResponse) {
  return response.status(410).json({
    error: "gone",
    message: "Este endpoint foi desativado. Use o dashboard Stripe para reembolsos.",
  });
}
