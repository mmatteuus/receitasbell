import { beforeEach, describe, expect, test, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  mercadoPagoOAuthState: {
    create: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
}));

const envMock = vi.hoisted(() => ({
  getMercadoPagoAppEnv: vi.fn(() => ({
    clientId: "client-id",
    clientSecret: "client-secret",
    redirectUri: "https://app.exemplo.com/api/mercadopago/oauth/callback",
  })),
}));

const connectionsMock = vi.hoisted(() => ({
  upsertTenantMercadoPagoConnection: vi.fn(),
}));

vi.mock("../src/server/db/prisma.js", () => ({
  getPrisma: () => prismaMock,
}));
vi.mock("../src/server/env.js", () => envMock);
vi.mock("../src/server/mercadopago/connections.js", () => connectionsMock);

import { hashOpaqueState } from "../src/server/security/state.js";
import { completeMercadoPagoOAuth, createMercadoPagoOAuthStart } from "../src/server/mercadopago/oauth.js";

describe("mercado pago oauth service", () => {
  beforeEach(() => {
    prismaMock.mercadoPagoOAuthState.create.mockReset();
    prismaMock.mercadoPagoOAuthState.findUnique.mockReset();
    prismaMock.mercadoPagoOAuthState.update.mockReset();
    connectionsMock.upsertTenantMercadoPagoConnection.mockReset();
    vi.restoreAllMocks();
  });

  test("gera URL oficial de autorização e persiste state", async () => {
    prismaMock.mercadoPagoOAuthState.create.mockResolvedValue({ id: "state-1" });

    const result = await createMercadoPagoOAuthStart({
      tenantId: "tenant-1",
      tenantUserId: "user-1",
      returnTo: "/t/acme/admin/pagamentos/configuracoes",
    });

    expect(prismaMock.mercadoPagoOAuthState.create).toHaveBeenCalledTimes(1);
    expect(result.authorizationUrl).toContain("https://auth.mercadopago.com/authorization");
    expect(result.authorizationUrl).toContain("client_id=client-id");
    expect(result.authorizationUrl).toContain("response_type=code");
    expect(result.authorizationUrl).toContain("platform_id=mp");
    expect(result.authorizationUrl).toContain(encodeURIComponent("https://app.exemplo.com/api/mercadopago/oauth/callback"));
    expect(result.state).toBeTruthy();
  });

  test("conclui callback, consome state e persiste conexao do seller", async () => {
    prismaMock.mercadoPagoOAuthState.findUnique.mockResolvedValue({
      id: "oauth-state-1",
      tenantId: "tenant-1",
      tenantUserId: "user-1",
      stateHash: hashOpaqueState("state-123"),
      expiresAt: new Date(Date.now() + 5 * 60_000),
      consumedAt: null,
      returnTo: "/t/acme/admin/pagamentos/configuracoes",
    });
    prismaMock.mercadoPagoOAuthState.update.mockResolvedValue({
      id: "oauth-state-1",
    });
    connectionsMock.upsertTenantMercadoPagoConnection.mockResolvedValue({
      id: "connection-1",
      tenantId: "tenant-1",
    });

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          access_token: "seller-access",
          refresh_token: "seller-refresh",
          expires_in: 21600,
          scope: "offline_access payments",
          user_id: 123456,
          public_key: "APP_USR-test",
        }),
      }),
    );

    const result = await completeMercadoPagoOAuth({
      code: "auth-code-1",
      state: "state-123",
    });

    expect(prismaMock.mercadoPagoOAuthState.update).toHaveBeenCalledWith({
      where: { id: "oauth-state-1" },
      data: { consumedAt: expect.any(Date) },
    });
    expect(connectionsMock.upsertTenantMercadoPagoConnection).toHaveBeenCalledWith({
      tenantId: "tenant-1",
      actorUserId: "user-1",
      mercadoPagoUserId: "123456",
      accessToken: "seller-access",
      refreshToken: "seller-refresh",
      expiresIn: 21600,
      scope: "offline_access payments",
      publicKey: "APP_USR-test",
    });
    expect(result.returnTo).toBe("/t/acme/admin/pagamentos/configuracoes");
  });
});
