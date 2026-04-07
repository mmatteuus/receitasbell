import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  assertMethod,
  json,
  withApiHandler,
  ApiError,
} from '../../../src/server/shared/http.js';
import { validateAdminInviteToken } from '../../../src/server/admin/invites.js';

export default withApiHandler(
  async (request: VercelRequest, response: VercelResponse, { requestId, logger }) => {
    assertMethod(request, ['GET']);

    const token = request.headers['x-invite-token'] as string | undefined;
    if (!token) {
      return json(response, 400, {
        status: 'invalid',
        message: 'Token de convite não fornecido.',
        requestId,
      });
    }

    try {
      const inviteData = await validateAdminInviteToken(token, { logger });
      return json(response, 200, {
        status: inviteData.status,
        email: inviteData.email,
        tenantName: inviteData.tenantName,
        tenantSlug: inviteData.tenantSlug,
        message: inviteData.message,
        requestId,
      });
    } catch (err) {
      logger.error('Failed to validate admin invite token', { error: err, token: token?.slice(0, 10) });

      if (err instanceof ApiError) {
        return json(response, err.status, {
          status: 'invalid',
          message: err.message,
          requestId,
        });
      }

      return json(response, 500, {
        status: 'invalid',
        message: 'Erro ao validar convite.',
        requestId,
      });
    }
  }
);
