import { beforeEach, describe, expect, test, vi } from "vitest";

const baserowMock = vi.hoisted(() => ({
  fetchBaserow: vi.fn(),
}));

const envMock = vi.hoisted(() => ({
  getMercadoPagoAppEnvAsync: vi.fn(async () => ({
    clientId: "client-id",
    clientSecret: "client-secret",
    redirectUri: "https://app.exemplo.com/api/mercadopago/oauth/callback",
  })),
}));

const connectionsMock = vi.hoisted(() => ({
  upsertTenantMercadoPagoConnection: vi.fn(),
}));

vi.mock("../src/server/integrations/baserow/client.js", () => ({
  fetchBaserow: baserowMock.fetchBaserow,
  BASEROW_TABLES: {
    OAUTH_STATES: "oauth_states_table",
    TENANTS: "tenants_table",
    SETTINGS: "settings_table",
    RECIPES: "recipes_table",
    PAYMENTS: "payments_table",
    PAYMENT_EVENTS: "payment_events_table",
  }
}));
vi.mock("../src/server/shared/env.js", () => envMock);
vi.mock("../src/server/integrations/mercadopago/connections.js", () => connectionsMock);

import { hashOpaqueState } from "../src/server/shared/state.js";
import { 
  handleMercadoPagoOAuthCallback as completeMercadoPagoOAuth, 
  getMercadoPagoConnectUrl as createMercadoPagoOAuthStart 
} from "../src/server/integrations/mercadopago/oauth.js";

describe("mercado pago oauth service", () => {
  beforeEach(() => {
    baserowMock.fetchBaserow.mockReset();
    connectionsMock.upsertTenantMercadoPagoConnection.mockReset();
    vi.restoreAllMocks();
  });

  test("gera URL oficial de autorização e persiste state no baserow", async () => {
    baserowMock.fetchBaserow.mockResolvedValue({ id: "state-row-1" });

    const result = await createMercadoPagoOAuthStart("tenant-1", {
      tenantUserId: "user-1",
      returnTo: "/admin/custom",
    });

    expect(baserowMock.fetchBaserow).toHaveBeenCalledWith(
      expect.stringContaining("/api/database/rows/table/"),
      expect.objectContaining({ method: "POST" })
    );

    expect(result.authorizationUrl).toContain("https://auth.mercadopago.com/authorization");
    expect(result.authorizationUrl).toContain("client_id=client-id");
    expect(result.state).toBeTruthy();
  });

  test("conclui callback, consome state e persiste conexao", async () => {
    // 1. Mock finding the state in Baserow
    baserowMock.fetchBaserow.mockResolvedValueOnce({
      results: [{
        id: "oauth-state-1",
        tenantId: "tenant-1",
        tenantUserId: "user-1",
        stateHash: hashOpaqueState("state-123"),
        expiresAt: new Date(Date.now() + 5 * 60_000).toISOString(),
        returnTo: "/admin/custom",
      }]
    });

    // 2. Mock deleting the state (consuming it)
    baserowMock.fetchBaserow.mockResolvedValueOnce({});

    // 3. Mock the fetch to Mercado Pago Token API
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        access_token: "seller-access",
        refresh_token: "seller-refresh",
        expires_in: 21600,
        user_id: 123456,
        public_key: "APP_USR-test",
      }),
    }));

    const result = await completeMercadoPagoOAuth("auth-code-1", "state-123");

    expect(connectionsMock.upsertTenantMercadoPagoConnection).toHaveBeenCalledWith(expect.objectContaining({
      tenantId: "tenant-1",
      accessToken: "seller-access",
      mercadoPagoUserId: "123456",
      expiresIn: 21600,
    }));

    expect(result.returnTo).toBe("/admin/custom");
  });

  test("rejeita reutilizacao de state OAuth", async () => {
    baserowMock.fetchBaserow
      .mockResolvedValueOnce({
        results: [{
          id: "oauth-state-2",
          tenantId: "tenant-1",
          tenantUserId: "user-1",
          stateHash: hashOpaqueState("state-reuse"),
          expiresAt: new Date(Date.now() + 5 * 60_000).toISOString(),
          returnTo: "/admin/custom",
        }],
      })
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ results: [] });

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        access_token: "seller-access",
        refresh_token: "seller-refresh",
        expires_in: 21600,
        user_id: 123456,
      }),
    }));

    await completeMercadoPagoOAuth("auth-code-2", "state-reuse");

    await expect(
      completeMercadoPagoOAuth("auth-code-2", "state-reuse"),
    ).rejects.toThrow("OAuth state inválido ou expirado.");
  });
});
