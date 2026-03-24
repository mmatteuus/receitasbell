import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withApiHandler, getQueryValue, ApiError } from '../../src/server/shared/http.js';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return withApiHandler(request, response, async ({ requestId }) => {
    const url = new URL(request.url || '', 'http://localhost');
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');

    if (!code || !state) throw new ApiError(400, 'Missing code or state');

    const { handleMercadoPagoOAuthCallback } = await import('../../src/server/integrations/mercadopago/oauth.js');
    const { returnTo } = await handleMercadoPagoOAuthCallback(code, state);
    
    response.redirect(302, returnTo || '/');
  });
}
