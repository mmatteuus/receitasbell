import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withApiHandler, getQueryValue, ApiError } from '../../src/server/http.js';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return withApiHandler(request, response, async () => {
    const code = getQueryValue(request.query.code as any);
    const state = getQueryValue(request.query.state as any);
    if (!code || !state) throw new ApiError(400, 'Missing code or state');

    const { handleMercadoPagoOAuthCallback } = await import('../../src/server/mercadopago/oauth.js');
    const { returnTo } = await handleMercadoPagoOAuthCallback(code, state);
    
    return response.redirect(302, returnTo || '/');
  });
}
