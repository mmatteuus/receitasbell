import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  withApiHandler,
  assertMethod,
  readJsonBody,
  json,
  getClientAddress,
} from '../../src/server/shared/http.js';
import { authRateLimit, checkRateLimit } from '../../src/server/shared/rateLimit.js';
import { startSocialOAuth } from '../../src/server/auth/social/service.js';
import { ApiError } from '../../src/server/shared/http.js';

/**
 * POST /api/auth/oauth/start
 * Inicia o fluxo OAuth Social gravando o state e retornando a URL de autorização.
 */
export default withApiHandler(async (req, res, { logger }) => {
  assertMethod(req, ['POST']);

  const body = await readJsonBody<{ provider: 'google'; redirectTo?: string; tenantId: string }>(
    req
  );

  if (!body.provider || !body.tenantId) {
    throw new ApiError(400, 'Missing required fields: provider, tenantId');
  }

  // 1. Rate limit distribuído (Upstash em prod)
  const ip = getClientAddress(req);
  if (authRateLimit) {
    const rl = await checkRateLimit(authRateLimit, ip);
    if (!rl.success) {
      throw new ApiError(429, 'Too many authentication attempts', { retryAfter: rl.reset });
    }
  }

  logger.info('OAuth start flow initiated', { provider: body.provider, tenantId: body.tenantId });

  // 2. Inicia o fluxo com o service
  const result = await startSocialOAuth({
    provider: body.provider,
    tenantId: body.tenantId,
    redirectTo: body.redirectTo || '/minha-conta',
    userAgent: req.headers['user-agent'],
    ip,
  });

  return json(res, 200, {
    success: true,
    data: result,
  });
});
