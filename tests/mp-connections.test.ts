import { beforeEach, describe, expect, test, vi } from "vitest";

const baserowMock = vi.hoisted(() => ({
  fetchBaserow: vi.fn(),
}));

const settingsMock = vi.hoisted(() => ({
  getSettingsMap: vi.fn(),
  updateSettings: vi.fn(),
}));

const auditMock = vi.hoisted(() => ({
  logAuditEvent: vi.fn(),
}));

const tenancyMock = vi.hoisted(() => ({
  getTenantById: vi.fn(),
}));

vi.mock("../src/server/integrations/baserow/client.js", () => ({
  fetchBaserow: baserowMock.fetchBaserow,
  BASEROW_TABLES: {
    MP_CONNECTIONS: 999,
  },
}));

vi.mock("../src/server/settings/repo.js", () => ({
  getSettingsMap: settingsMock.getSettingsMap,
  updateSettings: settingsMock.updateSettings,
}));

vi.mock("../src/server/audit/repo.js", () => ({
  logAuditEvent: auditMock.logAuditEvent,
}));

vi.mock("../src/server/tenancy/repo.js", () => ({
  getTenantById: tenancyMock.getTenantById,
}));

import {
  disconnectTenantMercadoPagoConnection,
  getTenantMercadoPagoConnection,
  getUsableMercadoPagoAccessToken,
  repairMercadoPagoActiveConnections,
  upsertTenantMercadoPagoConnection,
} from "../src/server/integrations/mercadopago/connections.js";
import { encryptSecret } from "../src/server/shared/crypto.js";

describe("mercado pago connections persistence", () => {
  beforeEach(() => {
    baserowMock.fetchBaserow.mockReset();
    settingsMock.getSettingsMap.mockReset();
    settingsMock.updateSettings.mockReset();
    auditMock.logAuditEvent.mockReset();
    tenancyMock.getTenantById.mockReset();
    tenancyMock.getTenantById.mockResolvedValue(null);
    vi.restoreAllMocks();
  });

  test("migrates legacy settings token to mp_connections and clears plaintext settings", async () => {
    settingsMock.getSettingsMap.mockResolvedValue({
      mp_access_token: "legacy-token",
      mp_refresh_token: "legacy-refresh",
      mp_public_key: "APP_USR-legacy",
      mp_user_id: "123",
    });
    settingsMock.updateSettings.mockResolvedValue({});

    baserowMock.fetchBaserow.mockImplementation(async (_path: string, init?: RequestInit) => {
      if (!init?.method) return { results: [] };
      if (init.method === "POST") {
        return {
          id: 1,
          tenant_id: "tenant-1",
          mercado_pago_user_id: "123",
          access_token_encrypted: "encrypted-access",
          refresh_token_encrypted: "encrypted-refresh",
          public_key: "APP_USR-legacy",
          status: "connected",
          connected_at: new Date().toISOString(),
          disconnected_at: "",
          last_refresh_at: new Date().toISOString(),
          last_error: "",
          created_by_user_id: "migration",
          updated_at: new Date().toISOString(),
        };
      }
      return {};
    });

    const connection = await getTenantMercadoPagoConnection("tenant-1");
    expect(connection).not.toBeNull();
    expect(connection?.status).toBe("connected");
    expect(connection?.accessTokenEncrypted).not.toBe("legacy-token");
    expect(settingsMock.updateSettings).toHaveBeenCalledWith("tenant-1", {
      mp_access_token: "",
      mp_refresh_token: "",
      mp_public_key: "",
      mp_user_id: "",
    });
  });

  test("disconnect marks active connection as disconnected", async () => {
    settingsMock.getSettingsMap.mockResolvedValue({
      mp_access_token: "legacy-token",
      mp_refresh_token: "legacy-refresh",
      mp_public_key: "APP_USR-legacy",
      mp_user_id: "123",
    });
    baserowMock.fetchBaserow.mockImplementation(async (_path: string, init?: RequestInit) => {
      if (!init?.method) {
        return {
          results: [
            {
              id: 10,
              tenant_id: "tenant-2",
              status: "connected",
            },
          ],
        };
      }
      return {};
    });
    settingsMock.updateSettings.mockResolvedValue({});

    await disconnectTenantMercadoPagoConnection({
      tenantId: "tenant-2",
      actorUserId: "admin-1",
    });

    expect(baserowMock.fetchBaserow).toHaveBeenCalledWith(
      expect.stringContaining("/999/10/"),
      expect.objectContaining({
        method: "PATCH",
      }),
    );
    expect(settingsMock.updateSettings).toHaveBeenCalledWith("tenant-2", {
      mp_access_token: "",
      mp_refresh_token: "",
      mp_public_key: "",
      mp_user_id: "",
    });
  });

  test("persiste expires_at no upsert e registra conexoes substituidas", async () => {
    settingsMock.getSettingsMap.mockResolvedValue({
      mp_access_token: "",
      mp_refresh_token: "",
      mp_public_key: "",
      mp_user_id: "",
    });
    settingsMock.updateSettings.mockResolvedValue({});

    baserowMock.fetchBaserow.mockImplementation(async (path: string, init?: RequestInit) => {
      if (!init?.method) {
        return {
          results: [
            {
              id: 19,
              tenant_id: "tenant-9",
              status: "connected",
            },
          ],
        };
      }
      if (init.method === "POST") {
        return {
          id: 20,
          tenant_id: "tenant-9",
          mercado_pago_user_id: "777",
          access_token_encrypted: encryptSecret("new-access"),
          refresh_token_encrypted: encryptSecret("new-refresh"),
          status: "connected",
          connected_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
          disconnected_at: "",
          last_refresh_at: new Date().toISOString(),
          last_error: "",
          created_by_user_id: "admin-1",
          updated_at: new Date().toISOString(),
        };
      }
      if (init.method === "PATCH" && path.includes("/999/19/")) {
        return {};
      }
      return {};
    });

    await upsertTenantMercadoPagoConnection({
      tenantId: "tenant-9",
      actorUserId: "admin-1",
      mercadoPagoUserId: "777",
      accessToken: "new-access",
      refreshToken: "new-refresh",
      expiresIn: 3600,
    });

    expect(baserowMock.fetchBaserow).toHaveBeenCalledWith(
      expect.stringContaining("/api/database/rows/table/999/?user_field_names=true"),
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining("\"expires_at\""),
      }),
    );
    expect(auditMock.logAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "mercadopago.reconnect",
        payload: expect.objectContaining({
          replacedConnectionIds: ["19"],
        }),
      }),
    );
  });

  test("faz refresh preventivo quando expires_at esta perto", async () => {
    const previousClientId = process.env.MERCADO_PAGO_CLIENT_ID;
    const previousClientSecret = process.env.MERCADO_PAGO_CLIENT_SECRET;
    process.env.MERCADO_PAGO_CLIENT_ID = "client-id";
    process.env.MERCADO_PAGO_CLIENT_SECRET = "client-secret";

    const nowIso = new Date().toISOString();
    const soonIso = new Date(Date.now() + 60 * 1000).toISOString();
    const freshIso = new Date(Date.now() + 3600 * 1000).toISOString();

    const oldRow = {
      id: 31,
      tenant_id: "tenant-refresh",
      mercado_pago_user_id: "987",
      access_token_encrypted: encryptSecret("old-access"),
      refresh_token_encrypted: encryptSecret("old-refresh"),
      status: "connected",
      connected_at: nowIso,
      expires_at: soonIso,
      disconnected_at: "",
      last_refresh_at: nowIso,
      last_error: "",
      created_by_user_id: "admin",
      updated_at: nowIso,
    };
    const refreshedRow = {
      ...oldRow,
      access_token_encrypted: encryptSecret("new-access"),
      refresh_token_encrypted: encryptSecret("new-refresh"),
      expires_at: freshIso,
      last_refresh_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    settingsMock.getSettingsMap.mockResolvedValue({
      mp_access_token: "",
      mp_refresh_token: "",
      mp_public_key: "",
      mp_user_id: "",
    });
    settingsMock.updateSettings.mockResolvedValue({});
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        access_token: "new-access",
        refresh_token: "new-refresh",
        expires_in: 3600,
        user_id: "987",
      }),
    }));

    let connectionReads = 0;
    baserowMock.fetchBaserow.mockImplementation(async (path: string, init?: RequestInit) => {
      if (!init?.method && path.includes("filter__tenant_id__equal=tenant-refresh")) {
        return { results: [oldRow] };
      }
      if (!init?.method && path.includes("/999/31/")) {
        connectionReads += 1;
        return connectionReads > 1 ? refreshedRow : oldRow;
      }
      if (init?.method === "PATCH" && path.includes("/999/31/")) {
        return {};
      }
      return { results: [] };
    });

    try {
      const result = await getUsableMercadoPagoAccessToken("tenant-refresh");
      expect(result.accessToken).toBe("new-access");
      expect(auditMock.logAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "mercadopago.refresh_success",
        }),
      );
    } finally {
      if (previousClientId === undefined) delete process.env.MERCADO_PAGO_CLIENT_ID;
      else process.env.MERCADO_PAGO_CLIENT_ID = previousClientId;
      if (previousClientSecret === undefined) delete process.env.MERCADO_PAGO_CLIENT_SECRET;
      else process.env.MERCADO_PAGO_CLIENT_SECRET = previousClientSecret;
    }
  });

  test("repair desconecta conexoes duplicadas mantendo a mais recente", async () => {
    baserowMock.fetchBaserow.mockImplementation(async (path: string, init?: RequestInit) => {
      if (!init?.method && path.includes("order_by=tenant_id,-id")) {
        return {
          results: [
            {
              id: 200,
              tenant_id: "tenant-a",
              status: "connected",
              connected_at: "2026-03-25T12:00:00.000Z",
              updated_at: "2026-03-25T12:00:00.000Z",
            },
            {
              id: 199,
              tenant_id: "tenant-a",
              status: "connected",
              connected_at: "2026-03-20T12:00:00.000Z",
              updated_at: "2026-03-20T12:00:00.000Z",
            },
          ],
          next: null,
        };
      }
      if (init?.method === "PATCH" && path.includes("/999/199/")) {
        return {};
      }
      return {};
    });

    const stats = await repairMercadoPagoActiveConnections();
    expect(stats.repairedTenants).toBe(1);
    expect(stats.disconnectedConnections).toBe(1);
    expect(auditMock.logAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "mercadopago.connection_repaired",
      }),
    );
  });

  test("encontra conexao legada salva com slug do tenant quando id numerico nao retorna linhas", async () => {
    tenancyMock.getTenantById.mockResolvedValue({
      id: "34",
      slug: "receitasbell",
      name: "Receitas Bell",
      host: "receitasbell.mtsferreira.dev",
      status: "active",
      createdAt: "2026-03-28T00:00:00.000Z",
    });
    settingsMock.getSettingsMap.mockResolvedValue({
      mp_access_token: "",
      mp_refresh_token: "",
      mp_public_key: "",
      mp_user_id: "",
    });

    baserowMock.fetchBaserow.mockImplementation(async (path: string) => {
      if (path.includes("filter__tenant_id__equal=34")) {
        return { results: [] };
      }
      if (path.includes("filter__tenantId__equal=34")) {
        return { results: [] };
      }
      if (path.includes("filter__tenant_id__equal=receitasbell")) {
        return {
          results: [
            {
              id: 67,
              tenant_id: "receitasbell",
              mercado_pago_user_id: "8533405491426561",
              access_token_encrypted: encryptSecret("token"),
              refresh_token_encrypted: "",
              public_key: "APP_USR-public",
              status: "connected",
              connected_at: "2026-03-26T00:00:00.000Z",
              expires_at: "",
              disconnected_at: "",
              last_refresh_at: "2026-03-26T00:00:00.000Z",
              last_error: "",
              created_by_user_id: "admin-1",
              updated_at: "2026-03-26T00:00:00.000Z",
            },
          ],
        };
      }
      if (path.includes("filter__tenantId__equal=receitasbell")) {
        return { results: [] };
      }
      return { results: [] };
    });

    const connection = await getTenantMercadoPagoConnection("34");
    expect(connection).not.toBeNull();
    expect(connection?.id).toBe("67");
    expect(connection?.tenantId).toBe("receitasbell");
  });
});
