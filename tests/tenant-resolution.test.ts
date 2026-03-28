import { beforeEach, describe, expect, test, vi } from "vitest";
import type { VercelRequest } from "@vercel/node";

const serviceMocks = vi.hoisted(() => ({
  findTenantByHost: vi.fn(),
  findTenantBySlug: vi.fn(),
  findTenantById: vi.fn(),
}));

const authMocks = vi.hoisted(() => ({
  getTenantAdminSessionClaims: vi.fn(),
}));

import {
  getTenantSlugFromRequest,
  requireTenantFromRequest,
} from "../src/server/tenancy/resolver.js";

vi.mock("../src/server/tenancy/repo.js", () => ({
  getTenantByHost: vi.fn(),
  getTenantBySlug: vi.fn(),
}));
import { getTenantByHost, getTenantBySlug } from "../src/server/tenancy/repo.js";

describe("tenant resolution", () => {
  beforeEach(() => {
    vi.mocked(getTenantByHost).mockReset();
    vi.mocked(getTenantBySlug).mockReset();
  });

  test("le de X-Tenant-Slug corretamente", () => {
    const request = {
      headers: {
        "x-tenant-slug": "minha-loja",
      },
    } as unknown as VercelRequest;

    expect(getTenantSlugFromRequest(request)).toBe("minha-loja");
  });

  test("resolve tenant por header", async () => {
    vi.mocked(getTenantBySlug).mockResolvedValue({
      id: "tenant-1",
      slug: "minha-loja",
      name: "Minha Loja",
    });

    const resolved = await requireTenantFromRequest({
      headers: { "x-signature": "sig", "x-request-id": "req", "x-tenant-slug": "minha-loja" },
    } as unknown as VercelRequest);

    expect(resolved.tenant.id).toBe("tenant-1");
  });

  test("resolve tenant por host (subdominio)", async () => {
    vi.mocked(getTenantByHost).mockResolvedValue({
      id: "tenant-2",
      slug: "loja-2",
      name: "Loja 2",
    });

    const resolved = await requireTenantFromRequest({
      headers: { host: "loja-2.receitasbell.com.br" },
    } as unknown as VercelRequest);

    expect(resolved.tenant.id).toBe("tenant-2");
  });

  test("falha se tenant nao encontrado", async () => {
    vi.mocked(getTenantBySlug).mockResolvedValue(null);

    await expect(requireTenantFromRequest({
      headers: { "x-tenant-slug": "invalid" },
    } as unknown as VercelRequest)).rejects.toThrow("Tenant not found");
  });
});
