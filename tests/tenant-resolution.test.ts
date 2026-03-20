import { beforeEach, describe, expect, test, vi } from "vitest";

const serviceMocks = vi.hoisted(() => ({
  findTenantByHost: vi.fn(),
  findTenantBySlug: vi.fn(),
  findTenantById: vi.fn(),
}));

const authMocks = vi.hoisted(() => ({
  getTenantAdminSessionClaims: vi.fn(),
}));

vi.mock("../src/server/tenants/service.js", () => serviceMocks);
vi.mock("../src/server/auth/sessions.js", () => authMocks);

import {
  getTenantSlugFromRequest,
  normalizeTenantSlug,
  resolveTenantFromRequest,
} from "../src/server/tenants/resolver.js";

describe("tenant resolution", () => {
  beforeEach(() => {
    serviceMocks.findTenantByHost.mockReset();
    serviceMocks.findTenantBySlug.mockReset();
    serviceMocks.findTenantById.mockReset();
    authMocks.getTenantAdminSessionClaims.mockReset();
  });

  test("normaliza slug e le de X-Tenant-Slug", () => {
    const request = {
      headers: {
        "x-tenant-slug": " Minha Loja ",
      },
      query: {},
    } as never;

    expect(normalizeTenantSlug(" Minha Loja ")).toBe("minha-loja");
    expect(getTenantSlugFromRequest(request)).toBe("minha-loja");
  });

  test("prioriza host sobre slug", async () => {
    serviceMocks.findTenantByHost.mockResolvedValue({
      id: "tenant-host",
      slug: "host-tenant",
      name: "Host Tenant",
    });
    serviceMocks.findTenantBySlug.mockResolvedValue({
      id: "tenant-slug",
      slug: "slug-tenant",
      name: "Slug Tenant",
    });

    const resolved = await resolveTenantFromRequest({
      headers: {
        host: "cliente.exemplo.com",
        "x-tenant-slug": "slug-tenant",
      },
      query: {},
    } as never);

    expect(resolved?.resolution).toBe("host");
    expect(resolved?.tenant.id).toBe("tenant-host");
  });

  test("usa sessão como fallback final", async () => {
    serviceMocks.findTenantByHost.mockResolvedValue(null);
    serviceMocks.findTenantBySlug.mockResolvedValue(null);
    serviceMocks.findTenantById.mockResolvedValue({
      id: "tenant-session",
      slug: "session-tenant",
      name: "Session Tenant",
    });
    authMocks.getTenantAdminSessionClaims.mockReturnValue({
      tid: "tenant-session",
      sid: "session-1",
      uid: "user-1",
      exp: Date.now() + 60_000,
    });

    const resolved = await resolveTenantFromRequest({
      headers: { host: "localhost:5173" },
      query: {},
    } as never);

    expect(resolved?.resolution).toBe("session");
    expect(resolved?.tenant.slug).toBe("session-tenant");
  });
});
