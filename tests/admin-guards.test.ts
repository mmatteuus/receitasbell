import { beforeEach, describe, expect, test, vi } from "vitest";
import type { VercelRequest } from "@vercel/node";

const envMock = vi.hoisted(() => ({
  env: {
    ADMIN_API_SECRET: "super-secret",
  },
  isProd: true,
}));

const authMocks = vi.hoisted(() => ({
  getUserSession: vi.fn(),
}));

const tenancyMocks = vi.hoisted(() => ({
  requireTenantFromRequest: vi.fn(),
}));

vi.mock("../src/server/shared/env.js", () => envMock);
vi.mock("../src/server/auth/sessions.js", () => ({
  getUserSession: authMocks.getUserSession,
}));
vi.mock("../src/server/tenancy/resolver.js", () => ({
  requireTenantFromRequest: tenancyMocks.requireTenantFromRequest,
}));

import { assertAdminAccess } from "../src/server/admin/guards.js";

describe("assertAdminAccess", () => {
  beforeEach(() => {
    authMocks.getUserSession.mockReset();
    tenancyMocks.requireTenantFromRequest.mockReset();
  });

  test("rejeita x-admin-token mestre em producao", async () => {
    await expect(
      assertAdminAccess({
        headers: {
          "x-admin-token": envMock.env.ADMIN_API_SECRET,
          "x-tenant-slug": "demo",
        },
      } as unknown as VercelRequest),
    ).rejects.toThrow("Forbidden: Admin access required");
  });

  test("permite sessao admin do tenant correto", async () => {
    authMocks.getUserSession.mockResolvedValue({
      userId: "u1",
      email: "admin@example.com",
      tenantId: "t1",
      role: "admin",
    });
    tenancyMocks.requireTenantFromRequest.mockResolvedValue({
      tenant: { id: "t1", slug: "demo", name: "Demo" },
    });

    const result = await assertAdminAccess({ headers: {} } as unknown as VercelRequest);

    expect(result.type).toBe("session");
    expect(result.role).toBe("admin");
  });

  test("rejeita sessao admin de outro tenant", async () => {
    authMocks.getUserSession.mockResolvedValue({
      userId: "u1",
      email: "owner@example.com",
      tenantId: "t1",
      role: "owner",
    });
    tenancyMocks.requireTenantFromRequest.mockResolvedValue({
      tenant: { id: "t2", slug: "other", name: "Other" },
    });

    await expect(assertAdminAccess({ headers: {} } as unknown as VercelRequest)).rejects.toThrow(
      "Forbidden: This administrator does not have access to this tenant",
    );
  });
});
