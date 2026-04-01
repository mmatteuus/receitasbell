import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withApiHandler, getQueryValue, getClientAddress } from '../../src/server/shared/http.js';
import { AuthRateLimit } from '../../src/server/shared/rateLimit.js';
import { finishGoogleOAuth } from '../../src/server/auth/social/service.js';
import { ApiError } from '../../src/server/shared/http.js';

/**
 * GET /api/auth/oauth/callback?provider=google&code=...&state=...&tenantId=...
 * Recebe o retorno do provedor OAuth, valida state, troca code por token,
 * resolve/cria usuário e estabelece a sessão do usuário.
 */
export default withApiHandler(async (req, res, { logger }) => {
  const provider = getQueryValue(req, 'provider') || 'google';
  const code = getQueryValue(req, 'code');
  const state = getQueryValue(req, 'state');
  const tenantId = getQueryValue(req, 'tenantId');

  if (!code || !state || !tenantId) {
    throw new ApiError(400, 'Parâmetros OAuth inválidos ou ausentes (code, state, tenantId).');
  }

  // 1. Rate limit distribuído (Upstash em prod)
  const ip = getClientAddress(req);
  const rl = await AuthRateLimit.check(ip);
  if (!rl.success) {
    throw new ApiError(429, 'Too many authentication attempts', { retryAfter: rl.resetAfter });
  }

  logger.info('OAuth callback received', { provider, tenantId });

  // 2. Finaliza o fluxo com o service
  if (provider !== 'google') {
    throw new ApiError(400, `Provedor social ${provider} não suportado ainda.`);
  }

  const { redirectTo } = await finishGoogleOAuth(req, res, {
    code,
    state,
    tenantId,
  });

  // 3. Redireciona o usuário para a URL de destino original (guardada no state)
  res.redirect(302, redirectTo);
});
