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
import { requireTenantFromRequest } from '../../src/server/tenancy/resolver.js';
import { env } from '../../src/server/shared/env.js';

/**
 * POST /api/auth/oauth/start
 * Inicia o fluxo OAuth Social gravando o state e retornando a URL de autorização.
 * O tenantId é resolvido a partir do Host da request (igual a outros handlers).
 */
export default withApiHandler(async (req, res, { logger }) => {
  assertMethod(req, ['POST']);

  const body = await readJsonBody<{ provider: 'google'; redirectTo?: string }>(req);

  if (!body.provider) {
    throw new ApiError(400, 'Missing required field: provider');
  }

  // Verifica se o OAuth social está habilitado via variável de ambiente
  if (env.AUTH_SOCIAL_ENABLED === false) {
    throw new ApiError(503, 'Login social não está habilitado nesta instância.');
  }

  // 1. Resolve tenant pelo Host da request (não requer envio do tenantId pelo cliente)
  const { tenant } = await requireTenantFromRequest(req);

  // 2. Rate limit distribuído (Upstash em prod)
  const ip = getClientAddress(req);
  if (authRateLimit) {
    const rl = await checkRateLimit(authRateLimit, ip);
    if (!rl.success) {
      throw new ApiError(429, 'Too many authentication attempts', { retryAfter: rl.reset });
    }
  }

  logger.info('OAuth start flow initiated', { provider: body.provider, tenantId: tenant.id });

  // 3. Inicia o fluxo com o service
  const result = await startSocialOAuth({
    provider: body.provider,
    tenantId: String(tenant.id),
    redirectTo: body.redirectTo || '/minha-conta',
    userAgent: req.headers['user-agent'],
    ip,
  });

  return json(res, 200, {
    success: true,
    data: result,
  });
});
