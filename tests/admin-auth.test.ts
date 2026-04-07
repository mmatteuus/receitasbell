import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const tenancyRepoMocks = vi.hoisted(() => ({
  countTenants: vi.fn(),
  getTenantBySlug: vi.fn(),
  getTenantByHost: vi.fn(),
  listActiveTenants: vi.fn(),
}));

const tenancyServiceMocks = vi.hoisted(() => ({
  createTenantBootstrap: vi.fn(),
}));

const sessionMocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  createSession: vi.fn(),
  revokeSession: vi.fn(),
}));

const auditMocks = vi.hoisted(() => ({
  createAuditLog: vi.fn(),
}));

const identityMocks = vi.hoisted(() => ({
  findUserByEmailForTenant: vi.fn(),
  updateUserPasswordCredentials: vi.fn(),
}));

const passwordMocks = vi.hoisted(() => ({
  assertStrongAdminPassword: vi.fn(),
  hashAdminPassword: vi.fn(),
  verifyAdminPasswordHash: vi.fn(),
}));

vi.mock('../src/server/tenancy/repo.js', () => ({
  countTenants: tenancyRepoMocks.countTenants,
  getTenantBySlug: tenancyRepoMocks.getTenantBySlug,
  getTenantByHost: tenancyRepoMocks.getTenantByHost,
  listActiveTenants: tenancyRepoMocks.listActiveTenants,
}));

vi.mock('../src/server/tenancy/service.js', () => ({
  createTenantBootstrap: tenancyServiceMocks.createTenantBootstrap,
}));

vi.mock('../src/server/auth/sessions.js', () => ({
  getSession: sessionMocks.getSession,
  createSession: sessionMocks.createSession,
  revokeSession: sessionMocks.revokeSession,
}));

vi.mock('../src/server/audit/service.js', () => ({
  createAuditLog: auditMocks.createAuditLog,
}));

vi.mock('../src/server/identity/repo.js', () => ({
  findUserByEmailForTenant: identityMocks.findUserByEmailForTenant,
  updateUserPasswordCredentials: identityMocks.updateUserPasswordCredentials,
}));

vi.mock('../src/server/auth/passwords.js', () => ({
  assertStrongAdminPassword: passwordMocks.assertStrongAdminPassword,
  hashAdminPassword: passwordMocks.hashAdminPassword,
  verifyAdminPasswordHash: passwordMocks.verifyAdminPasswordHash,
}));

import { bootstrapTenantAdmin, loginAdmin } from '../src/server/admin/auth.js';

describe('admin auth', () => {
  beforeEach(() => {
    tenancyRepoMocks.countTenants.mockReset();
    tenancyRepoMocks.getTenantBySlug.mockReset();
    tenancyRepoMocks.getTenantByHost.mockReset();
    tenancyRepoMocks.listActiveTenants.mockReset();
    tenancyServiceMocks.createTenantBootstrap.mockReset();
    sessionMocks.getSession.mockReset();
    sessionMocks.createSession.mockReset();
    sessionMocks.revokeSession.mockReset();
    auditMocks.createAuditLog.mockReset();
    identityMocks.findUserByEmailForTenant.mockReset();
    identityMocks.updateUserPasswordCredentials.mockReset();
    passwordMocks.assertStrongAdminPassword.mockReset();
    passwordMocks.hashAdminPassword.mockReset();
    passwordMocks.verifyAdminPasswordHash.mockReset();

    tenancyRepoMocks.getTenantBySlug.mockResolvedValue(null);
    tenancyRepoMocks.getTenantByHost.mockResolvedValue(null);
    tenancyRepoMocks.listActiveTenants.mockResolvedValue([]);
  });

  test('bootstrap cria tenant real e troca para sessao owner do tenant', async () => {
    tenancyRepoMocks.countTenants.mockResolvedValue(0);
    sessionMocks.getSession.mockResolvedValue({
      tenantId: 'system',
      userId: 'bootstrap-owner',
      email: 'owner@system.local',
      role: 'owner',
    });
    tenancyServiceMocks.createTenantBootstrap.mockResolvedValue({
      tenant: { id: 'tenant-1', slug: 'demo', name: 'Demo' },
      adminUser: { id: 'user-1', email: 'admin@demo.com' },
    });
    passwordMocks.hashAdminPassword.mockResolvedValue('scrypt$mock');

    const result = await bootstrapTenantAdmin(
      { headers: { cookie: 'rb_session=bootstrap' } } as unknown as VercelRequest,
      { setHeader: vi.fn() } as unknown as VercelResponse,
      {
        tenantName: 'Demo',
        tenantSlug: 'demo',
        adminEmail: 'admin@demo.com',
        adminPassword: 'SenhaForte!123',
      }
    );

    expect(passwordMocks.assertStrongAdminPassword).toHaveBeenCalledWith(
      'SenhaForte!123',
      'senha inicial do admin'
    );
    expect(tenancyServiceMocks.createTenantBootstrap).toHaveBeenCalledWith({
      tenantName: 'Demo',
      tenantSlug: 'demo',
      adminEmail: 'admin@demo.com',
      adminDisplayName: 'admin',
      adminPasswordHash: 'scrypt$mock',
      adminPasswordPlain: 'SenhaForte!123',
    });
    expect(sessionMocks.revokeSession).toHaveBeenCalled();
    expect(sessionMocks.createSession).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.objectContaining({
        tenantId: 'tenant-1',
        userId: 'user-1',
        email: 'admin@demo.com',
        role: 'owner',
      })
    );
    expect(result).toMatchObject({
      authenticated: true,
      mode: 'tenant',
      bootstrapRequired: false,
      tenant: { id: 'tenant-1', slug: 'demo', name: 'Demo' },
      user: { id: 'user-1', email: 'admin@demo.com', role: 'owner' },
    });
  });

  test('bootstrap falha quando ja existe tenant', async () => {
    tenancyRepoMocks.countTenants.mockResolvedValue(1);

    await expect(
      bootstrapTenantAdmin({ headers: {} } as unknown as VercelRequest, {} as VercelResponse, {
        tenantName: 'Demo',
        tenantSlug: 'demo',
        adminEmail: 'admin@demo.com',
        adminPassword: 'SenhaForte!123',
      })
    ).rejects.toThrow('Bootstrap is only available before the first tenant is created');
  });

  test('login admin retorna contrato completo no modo tenant', async () => {
    tenancyRepoMocks.countTenants.mockResolvedValue(1);
    tenancyRepoMocks.getTenantBySlug.mockResolvedValue({
      id: 'tenant-1',
      slug: 'demo',
      name: 'Demo',
    });
    identityMocks.findUserByEmailForTenant.mockResolvedValue({
      id: 'user-1',
      email: 'admin@demo.com',
      role: 'owner',
      passwordHash: 'scrypt$mock',
      legacyPassword: '',
    });
    passwordMocks.verifyAdminPasswordHash.mockResolvedValue(true);

    const result = await loginAdmin(
      { headers: { 'x-tenant-slug': 'demo' } } as unknown as VercelRequest,
      { setHeader: vi.fn() } as unknown as VercelResponse,
      { email: 'admin@demo.com', password: 'SenhaForte!123' }
    );

    expect(passwordMocks.verifyAdminPasswordHash).toHaveBeenCalledWith(
      'SenhaForte!123',
      'scrypt$mock'
    );
    expect(result).toMatchObject({
      authenticated: true,
      mode: 'tenant',
      bootstrapRequired: false,
      tenant: { id: 'tenant-1', slug: 'demo', name: 'Demo' },
      user: { id: 'user-1', email: 'admin@demo.com', role: 'owner' },
    });
  });

  test('migra credencial legada em texto puro para hash', async () => {
    tenancyRepoMocks.countTenants.mockResolvedValue(1);
    tenancyRepoMocks.getTenantBySlug.mockResolvedValue({
      id: 'tenant-1',
      slug: 'demo',
      name: 'Demo',
    });
    identityMocks.findUserByEmailForTenant.mockResolvedValue({
      id: 'user-1',
      email: 'admin@demo.com',
      role: 'admin',
      passwordHash: '',
      legacyPassword: 'SenhaForte!123',
    });
    passwordMocks.hashAdminPassword.mockResolvedValue('scrypt$migrated');

    await loginAdmin(
      { headers: { 'x-tenant-slug': 'demo' } } as unknown as VercelRequest,
      { setHeader: vi.fn() } as unknown as VercelResponse,
      { email: 'admin@demo.com', password: 'SenhaForte!123' }
    );

    expect(passwordMocks.assertStrongAdminPassword).toHaveBeenCalledWith(
      'SenhaForte!123',
      'senha do admin'
    );
    expect(identityMocks.updateUserPasswordCredentials).toHaveBeenCalledWith({
      userId: 'user-1',
      passwordHash: 'scrypt$migrated',
      legacyPassword: '',
    });
  });

  test('bloqueia administrador inativo', async () => {
    tenancyRepoMocks.countTenants.mockResolvedValue(1);
    tenancyRepoMocks.getTenantBySlug.mockResolvedValue({
      id: 'tenant-1',
      slug: 'demo',
      name: 'Demo',
    });
    identityMocks.findUserByEmailForTenant.mockResolvedValue({
      id: 'user-1',
      email: 'admin@demo.com',
      role: 'admin',
      passwordHash: 'scrypt$mock',
      legacyPassword: '',
      status: 'inactive',
    });

    await expect(
      loginAdmin(
        { headers: { 'x-tenant-slug': 'demo' } } as unknown as VercelRequest,
        { setHeader: vi.fn() } as unknown as VercelResponse,
        { email: 'admin@demo.com', password: 'SenhaForte!123' }
      )
    ).rejects.toThrow('Inactive administrator');
  });

  test('login sem header autentica quando existe um unico tenant ativo', async () => {
    tenancyRepoMocks.countTenants.mockResolvedValue(1);
    tenancyRepoMocks.listActiveTenants.mockResolvedValue([
      { id: 'tenant-1', slug: 'demo', name: 'Demo' },
    ]);
    identityMocks.findUserByEmailForTenant.mockResolvedValue({
      id: 'user-1',
      email: 'admin@demo.com',
      role: 'owner',
      passwordHash: 'scrypt$mock',
      legacyPassword: '',
    });
    passwordMocks.verifyAdminPasswordHash.mockResolvedValue(true);

    const result = await loginAdmin(
      { headers: {} } as unknown as VercelRequest,
      { setHeader: vi.fn() } as unknown as VercelResponse,
      { email: 'admin@demo.com', password: 'SenhaForte!123' }
    );

    expect(result).toMatchObject({
      authenticated: true,
      mode: 'tenant',
      bootstrapRequired: false,
      tenant: { id: 'tenant-1', slug: 'demo', name: 'Demo' },
      user: { id: 'user-1', email: 'admin@demo.com', role: 'owner' },
    });
  });

  test('login resolve tenant pelo host exato', async () => {
    tenancyRepoMocks.countTenants.mockResolvedValue(1);
    tenancyRepoMocks.getTenantByHost.mockResolvedValue({
      id: 'tenant-1',
      slug: 'receitasbell',
      name: 'Receitas Bell',
    });
    identityMocks.findUserByEmailForTenant.mockResolvedValue({
      id: 'user-1',
      email: 'admin@demo.com',
      role: 'owner',
      passwordHash: 'scrypt$mock',
      legacyPassword: '',
    });
    passwordMocks.verifyAdminPasswordHash.mockResolvedValue(true);

    const result = await loginAdmin(
      { headers: { host: 'receitasbell.mtsferreira.dev' } } as unknown as VercelRequest,
      { setHeader: vi.fn() } as unknown as VercelResponse,
      { email: 'admin@demo.com', password: 'SenhaForte!123' }
    );

    expect(result).toMatchObject({
      authenticated: true,
      mode: 'tenant',
      bootstrapRequired: false,
      tenant: { id: 'tenant-1', slug: 'receitasbell', name: 'Receitas Bell' },
      user: { id: 'user-1', email: 'admin@demo.com', role: 'owner' },
    });
  });

  test('login falha sem contexto quando existem multiplos tenants ativos', async () => {
    tenancyRepoMocks.countTenants.mockResolvedValue(2);
    tenancyRepoMocks.listActiveTenants.mockResolvedValue([
      { id: 'tenant-1', slug: 'demo', name: 'Demo' },
      { id: 'tenant-2', slug: 'outro', name: 'Outro' },
    ]);

    await expect(
      loginAdmin(
        { headers: {} } as unknown as VercelRequest,
        { setHeader: vi.fn() } as unknown as VercelResponse,
        { email: 'admin@demo.com', password: 'SenhaForte!123' }
      )
    ).rejects.toThrow('Tenant context is required.');
  });
});
