import { describe, expect, test, vi } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const httpMocks = vi.hoisted(() => ({
  assertMethod: vi.fn(),
  readJsonBody: vi.fn(),
  json: vi.fn((_response, status, body) => ({ status, body })),
  withApiHandler: vi.fn(
    (callback) => async (request: VercelRequest, response: VercelResponse) =>
      callback(request, response, { requestId: 'req-1', logger: {} })
  ),
}));

const csrfMocks = vi.hoisted(() => ({
  requireCsrf: vi.fn(),
}));

const authMocks = vi.hoisted(() => ({
  bootstrapTenantAdmin: vi.fn(),
}));

vi.mock('../src/server/shared/http.js', () => httpMocks);
vi.mock('../src/server/security/csrf.js', () => csrfMocks);
vi.mock('../src/server/admin/auth.js', () => authMocks);

import handler from '../api_handlers/admin/auth/bootstrap.js';

describe('admin bootstrap route', () => {
  test('exige csrf antes de bootstrapTenantAdmin', async () => {
    httpMocks.readJsonBody.mockResolvedValue({
      tenantName: 'Demo',
      tenantSlug: 'demo',
      adminEmail: 'admin@demo.com',
      adminPassword: 'SenhaForte!123',
    });
    authMocks.bootstrapTenantAdmin.mockResolvedValue({
      authenticated: true,
      mode: 'tenant',
      bootstrapRequired: false,
      tenant: { id: 'tenant-1', slug: 'demo', name: 'Demo' },
      user: { id: 'user-1', email: 'admin@demo.com', role: 'owner' },
    });

    const response = {} as VercelResponse;
    await handler({ method: 'POST', headers: {}, body: {} } as VercelRequest, response);

    expect(csrfMocks.requireCsrf).toHaveBeenCalled();
    expect(authMocks.bootstrapTenantAdmin).toHaveBeenCalled();
    expect(httpMocks.json).toHaveBeenCalledWith(
      response,
      201,
      expect.objectContaining({ requestId: 'req-1' })
    );
  });
});
