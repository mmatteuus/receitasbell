import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  assertMethod,
  readJsonBody,
  json,
  withApiHandler,
  ApiError,
} from '../../../src/server/shared/http.js';
import { requireCsrf } from '../../../src/server/security/csrf.js';
import { acceptAdminInvite } from '../../../src/server/admin/invites.js';

export default withApiHandler(
  async (request: VercelRequest, response: VercelResponse, { requestId, logger }) => {
    assertMethod(request, ['POST']);
    requireCsrf(request);

    const body = await readJsonBody<{
      token?: string;
      password?: string;
      passwordConfirm?: string;
      tenantSlug?: string;
    }>(request);

    if (!body.token) {
      return json(response, 400, {
        authenticated: false,
        message: 'Token de convite é obrigatório.',
        requestId,
      });
    }

    if (!body.password || !body.passwordConfirm) {
      return json(response, 400, {
        authenticated: false,
        message: 'Senha e confirmação são obrigatórias.',
        requestId,
      });
    }

    if (body.password !== body.passwordConfirm) {
      return json(response, 400, {
        authenticated: false,
        message: 'As senhas não coincidem.',
        requestId,
      });
    }

    try {
      const session = await acceptAdminInvite(request, response, {
        token: body.token,
        password: body.password,
        tenantSlug: body.tenantSlug,
        logger,
      });

      return json(response, 200, {
        authenticated: session.authenticated,
        session,
        message: 'Convite aceito com sucesso.',
        requestId,
      });
    } catch (err) {
      logger.error('Failed to accept admin invite', { error: err, token: body.token?.slice(0, 10) });

      if (err instanceof ApiError) {
        return json(response, err.status, {
          authenticated: false,
          message: err.message,
          requestId,
        });
      }

      return json(response, 500, {
        authenticated: false,
        message: 'Erro ao aceitar convite.',
        requestId,
      });
    }
  }
);
