import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  assertMethod,
  readJsonBody,
  json,
  withApiHandler,
  ApiError,
} from '../../../src/server/shared/http.js';
import { requireCsrf } from '../../../src/server/security/csrf.js';
import { requestNewAdminInvite } from '../../../src/server/admin/invites.js';
import { requireTenantFromRequest } from '../../../src/server/tenancy/resolver.js';

export default withApiHandler(
  async (request: VercelRequest, response: VercelResponse, { requestId, logger }) => {
    assertMethod(request, ['POST']);
    requireCsrf(request);

    const body = await readJsonBody<{
      email?: string;
      reason?: string;
    }>(request);

    if (!body.email) {
      return json(response, 400, {
        success: false,
        message: 'E-mail é obrigatório.',
        requestId,
      });
    }

    try {
      const { tenant } = await requireTenantFromRequest(request);

      const result = await requestNewAdminInvite(String(tenant.id), body.email, body.reason, {
        logger,
      });

      return json(response, 200, {
        ...result,
        requestId,
      });
    } catch (err) {
      logger.error('Failed to request new admin invite', { error: err, email: body.email });

      if (err instanceof ApiError) {
        return json(response, err.statusCode, {
          success: false,
          message: err.message,
          requestId,
        });
      }

      return json(response, 500, {
        success: false,
        message: 'Erro ao solicitar novo convite.',
        requestId,
      });
    }
  }
);
