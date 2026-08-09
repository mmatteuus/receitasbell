import { beforeEach, describe, expect, test, vi } from 'vitest';

const auditRepoMocks = vi.hoisted(() => ({
  logAuditEvent: vi.fn(),
}));

vi.mock('../src/server/audit/repo.js', () => ({
  logAuditEvent: auditRepoMocks.logAuditEvent,
}));

import { createAuditLog } from '../src/server/audit/service.js';

describe('legacy audit service adapter', () => {
  beforeEach(() => {
    auditRepoMocks.logAuditEvent.mockReset();
    auditRepoMocks.logAuditEvent.mockResolvedValue(undefined);
  });

  test('converte o contrato legado para o evento suportado pelo schema atual', async () => {
    await createAuditLog({
      organization_id: '9f1b4880-9dd7-4c95-95f2-b3795dfc97bc',
      user_id: '85ffed1e-1a2b-4ca1-b156-5827cf8be2f6',
      action: 'admin.update_settings',
      resource: 'organizations',
      resource_id: '9f1b4880-9dd7-4c95-95f2-b3795dfc97bc',
      metadata: { source: 'settings' },
      ip: '127.0.0.1',
      user_agent: 'vitest',
    });

    expect(auditRepoMocks.logAuditEvent).toHaveBeenCalledTimes(1);
    expect(auditRepoMocks.logAuditEvent).toHaveBeenCalledWith({
      actorType: 'admin',
      actorId: '85ffed1e-1a2b-4ca1-b156-5827cf8be2f6',
      tenantId: '9f1b4880-9dd7-4c95-95f2-b3795dfc97bc',
      action: 'admin.update_settings',
      resourceType: 'organizations',
      resourceId: '9f1b4880-9dd7-4c95-95f2-b3795dfc97bc',
      payload: { source: 'settings' },
      ip: '127.0.0.1',
      userAgent: 'vitest',
    });
  });
});
