import type { VercelRequest, VercelResponse } from "@vercel/node";
import webhookStripeHandler from "../../src/server/payments/application/handlers/webhooks/stripe.js";

// Importante: Manter a configuração no arquivo de entrada da Vercel
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await webhookStripeHandler(req, res);
}

