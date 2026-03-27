import { beforeEach, describe, expect, test, vi } from "vitest";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const tenancyRepoMocks = vi.hoisted(() => ({
  countTenants: vi.fn(),
}));

const tenancyServiceMocks = vi.hoisted(() => ({
  createTenantBootstrap: vi.fn(),
}));

const tenancyResolverMocks = vi.hoisted(() => ({
  requireTenantFromRequest: vi.fn(),
}));

const sessionMocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  createSession: vi.fn(),
  revokeSession: vi.fn(),
}));

const auditMocks = vi.hoisted(() => ({
  auditLog: vi.fn(),
}));

const identityMocks = vi.hoisted(() => ({
  findUserByEmail: vi.fn(),
  updateUserPasswordCredentials: vi.fn(),
}));

const passwordMocks = vi.hoisted(() => ({
  assertStrongAdminPassword: vi.fn(),
  hashAdminPassword: vi.fn(),
  verifyAdminPasswordHash: vi.fn(),
}));

vi.mock("../src/server/tenancy/repo.js", () => ({
  countTenants: tenancyRepoMocks.countTenants,
}));

vi.mock("../src/server/tenancy/service.js", () => ({
  createTenantBootstrap: tenancyServiceMocks.createTenantBootstrap,
}));

vi.mock("../src/server/tenancy/resolver.js", () => ({
  requireTenantFromRequest: tenancyResolverMocks.requireTenantFromRequest,
}));

vi.mock("../src/server/auth/sessions.js", () => ({
  getSession: sessionMocks.getSession,
  createSession: sessionMocks.createSession,
  revokeSession: sessionMocks.revokeSession,
}));

vi.mock("../src/server/audit/service.js", () => ({
  auditLog: auditMocks.auditLog,
}));

vi.mock("../src/server/identity/repo.js", () => ({
  findUserByEmail: identityMocks.findUserByEmail,
  updateUserPasswordCredentials: identityMocks.updateUserPasswordCredentials,
}));

vi.mock("../src/server/auth/passwords.js", () => ({
  assertStrongAdminPassword: passwordMocks.assertStrongAdminPassword,
  hashAdminPassword: passwordMocks.hashAdminPassword,
  verifyAdminPasswordHash: passwordMocks.verifyAdminPasswordHash,
}));

import { bootstrapTenantAdmin, loginAdmin } from "../src/server/admin/auth.js";

describe("admin auth", () => {
  beforeEach(() => {
    tenancyRepoMocks.countTenants.mockReset();
    tenancyServiceMocks.createTenantBootstrap.mockReset();
    tenancyResolverMocks.requireTenantFromRequest.mockReset();
    sessionMocks.getSession.mockReset();
    sessionMocks.createSession.mockReset();
    sessionMocks.revokeSession.mockReset();
    auditMocks.auditLog.mockReset();
    identityMocks.findUserByEmail.mockReset();
    identityMocks.updateUserPasswordCredentials.mockReset();
    passwordMocks.assertStrongAdminPassword.mockReset();
    passwordMocks.hashAdminPassword.mockReset();
    passwordMocks.verifyAdminPasswordHash.mockReset();
  });

  test("bootstrap cria tenant real e troca para sessao owner do tenant", async () => {
    tenancyRepoMocks.countTenants.mockResolvedValue(0);
    sessionMocks.getSession.mockResolvedValue({
      tenantId: "system",
      userId: "bootstrap-owner",
      email: "owner@system.local",
      role: "owner",
    });
    tenancyServiceMocks.createTenantBootstrap.mockResolvedValue({
      tenant: { id: "tenant-1", slug: "demo", name: "Demo" },
      adminUser: { id: "user-1", email: "admin@demo.com" },
    });
    passwordMocks.hashAdminPassword.mockResolvedValue("scrypt$mock");

    const result = await bootstrapTenantAdmin(
      { headers: { cookie: "rb_session=bootstrap" } } as unknown as VercelRequest,
      { setHeader: vi.fn() } as unknown as VercelResponse,
      {
        tenantName: "Demo",
        tenantSlug: "demo",
        adminEmail: "admin@demo.com",
        adminPassword: "SenhaForte!123",
      },
    );

    expect(passwordMocks.assertStrongAdminPassword).toHaveBeenCalledWith("SenhaForte!123", "senha inicial do admin");
    expect(tenancyServiceMocks.createTenantBootstrap).toHaveBeenCalledWith({
      tenantName: "Demo",
      tenantSlug: "demo",
      adminEmail: "admin@demo.com",
      adminDisplayName: "admin",
      adminPasswordHash: "scrypt$mock",
    });
    expect(sessionMocks.revokeSession).toHaveBeenCalled();
    expect(sessionMocks.createSession).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.objectContaining({
        tenantId: "tenant-1",
        userId: "user-1",
        email: "admin@demo.com",
        role: "owner",
      }),
    );
    expect(result).toMatchObject({
      authenticated: true,
      mode: "tenant",
      bootstrapRequired: false,
      tenant: { id: "tenant-1", slug: "demo", name: "Demo" },
      user: { id: "user-1", email: "admin@demo.com", role: "owner" },
    });
  });

  test("bootstrap falha quando ja existe tenant", async () => {
    tenancyRepoMocks.countTenants.mockResolvedValue(1);

    await expect(
      bootstrapTenantAdmin(
        { headers: {} } as unknown as VercelRequest,
        {} as VercelResponse,
        {
          tenantName: "Demo",
          tenantSlug: "demo",
          adminEmail: "admin@demo.com",
          adminPassword: "SenhaForte!123",
        },
      ),
    ).rejects.toThrow("Bootstrap is only available before the first tenant is created");
  });

  test("login admin retorna contrato completo no modo tenant", async () => {
    tenancyRepoMocks.countTenants.mockResolvedValue(1);
    tenancyResolverMocks.requireTenantFromRequest.mockResolvedValue({
      tenant: { id: "tenant-1", slug: "demo", name: "Demo" },
    });
    identityMocks.findUserByEmail.mockResolvedValue({
      id: "user-1",
      email: "admin@demo.com",
      role: "owner",
      passwordHash: "scrypt$mock",
      legacyPassword: "",
    });
    passwordMocks.verifyAdminPasswordHash.mockResolvedValue(true);

    const result = await loginAdmin(
      { headers: { "x-tenant-slug": "demo" } } as unknown as VercelRequest,
      { setHeader: vi.fn() } as unknown as VercelResponse,
      { email: "admin@demo.com", password: "SenhaForte!123" },
    );

    expect(passwordMocks.verifyAdminPasswordHash).toHaveBeenCalledWith("SenhaForte!123", "scrypt$mock");
    expect(result).toMatchObject({
      authenticated: true,
      mode: "tenant",
      bootstrapRequired: false,
      tenant: { id: "tenant-1", slug: "demo", name: "Demo" },
      user: { id: "user-1", email: "admin@demo.com", role: "owner" },
    });
  });

  test("migra credencial legada em texto puro para hash", async () => {
    tenancyRepoMocks.countTenants.mockResolvedValue(1);
    tenancyResolverMocks.requireTenantFromRequest.mockResolvedValue({
      tenant: { id: "tenant-1", slug: "demo", name: "Demo" },
    });
    identityMocks.findUserByEmail.mockResolvedValue({
      id: "user-1",
      email: "admin@demo.com",
      role: "admin",
      passwordHash: "",
      legacyPassword: "SenhaForte!123",
    });
    passwordMocks.hashAdminPassword.mockResolvedValue("scrypt$migrated");

    await loginAdmin(
      { headers: { "x-tenant-slug": "demo" } } as unknown as VercelRequest,
      { setHeader: vi.fn() } as unknown as VercelResponse,
      { email: "admin@demo.com", password: "SenhaForte!123" },
    );

    expect(passwordMocks.assertStrongAdminPassword).toHaveBeenCalledWith("SenhaForte!123", "senha do admin");
    expect(identityMocks.updateUserPasswordCredentials).toHaveBeenCalledWith({
      userId: "user-1",
      passwordHash: "scrypt$migrated",
      legacyPassword: "",
    });
  });
});
