import type { VercelRequest, VercelResponse } from "@vercel/node";

import { paymentsRouter } from "../../src/server/payments/router.js";
import { globalRateLimit, checkRateLimit } from "../../src/server/shared/rateLimit.js";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(request: VercelRequest, response: VercelResponse) {
  const path = String(request.query.path || '');
  
  // Ignora rate limit para webhook para garantir recebimento de notificações do Stripe
  if (!path.includes('webhook') && globalRateLimit) {
    const ip = String(request.headers['x-forwarded-for'] || request.socket.remoteAddress || 'unknown').split(',')[0].trim();
    const result = await checkRateLimit(globalRateLimit, `payments:${ip}`);
    if (!result.success) {
      response.setHeader('Retry-After', String(result.reset));
      return response.status(429).json({
        error: 'Muitas solicitações. Por favor, aguarde.',
        retryAfter: result.reset
      });
    }
  }

  await paymentsRouter(request, response);
}
