import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  assertMethod,
  readJsonBody,
  json,
  withApiHandler,
} from '../../../src/server/shared/http.js';
import { requireCsrf } from '../../../src/server/security/csrf.js';
import { bootstrapTenantAdmin } from '../../../src/server/admin/auth.js';

export default withApiHandler(
  async (request: VercelRequest, response: VercelResponse, { requestId }) => {
    assertMethod(request, ['POST']);
    requireCsrf(request);
    const body = await readJsonBody<{
      tenantName?: string;
      tenantSlug?: string;
      adminEmail?: string;
      adminPassword?: string;
    }>(request);
    const session = await bootstrapTenantAdmin(request, response, body);
    return json(response, 201, { ...session, requestId });
  }
);
