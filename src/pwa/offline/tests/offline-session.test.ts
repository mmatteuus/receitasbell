// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock da camada de armazenamento do envelope
vi.mock("../auth/session-envelope", () => ({
  getSessionEnvelope: vi.fn(),
  saveSessionEnvelope: vi.fn(),
  clearSessionEnvelope: vi.fn(),
}));

import {
  getOfflineUserSession,
  getOfflineAdminSession,
  persistUserSessionEnvelope,
  persistAdminSessionEnvelope,
  clearOfflineSession,
} from "../auth/offline-auth";
import { getSessionEnvelope, saveSessionEnvelope, clearSessionEnvelope } from "../auth/session-envelope";

const mockGetEnvelope = vi.mocked(getSessionEnvelope);
const mockSaveEnvelope = vi.mocked(saveSessionEnvelope);
const mockClearEnvelope = vi.mocked(clearSessionEnvelope);

function futureIso(daysFromNow = 7) {
  return new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000).toISOString();
}

function pastIso(daysAgo = 1) {
  return new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
}

describe("getOfflineUserSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna null quando não há envelope", async () => {
    mockGetEnvelope.mockResolvedValue(undefined);
    const result = await getOfflineUserSession();
    expect(result).toBeNull();
  });

  it("retorna null quando envelope está expirado", async () => {
    mockGetEnvelope.mockResolvedValue({
      kind: "user",
      email: "user@test.com",
      tenantSlug: null,
      lastValidatedAt: pastIso(2),
      expiresAt: pastIso(1),
      deviceBound: true,
      restrictedOffline: false,
      version: 1,
      sessionState: { email: "user@test.com", tenantId: "t1", tenantSlug: null, userId: "u1", role: "user" },
    });
    const result = await getOfflineUserSession();
    expect(result).toBeNull();
  });

  it("retorna sessão válida quando envelope não expirou", async () => {
    mockGetEnvelope.mockResolvedValue({
      kind: "user",
      email: "user@test.com",
      tenantSlug: "minha-conta",
      lastValidatedAt: new Date().toISOString(),
      expiresAt: futureIso(7),
      deviceBound: true,
      restrictedOffline: false,
      version: 1,
      sessionState: { email: "user@test.com", tenantId: "t1", tenantSlug: "minha-conta", userId: "u1", role: "user" },
    });
    const result = await getOfflineUserSession();
    expect(result).not.toBeNull();
    expect(result?.authenticated).toBe(true);
    expect(result?.email).toBe("user@test.com");
    expect(result?.offline).toBe(true);
  });
});

describe("getOfflineAdminSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna null quando não há envelope admin", async () => {
    mockGetEnvelope.mockResolvedValue(undefined);
    const result = await getOfflineAdminSession();
    expect(result).toBeNull();
  });

  it("retorna null quando envelope admin expirou (TTL curto)", async () => {
    mockGetEnvelope.mockResolvedValue({
      kind: "admin",
      email: "admin@test.com",
      tenantSlug: "bell",
      lastValidatedAt: pastIso(2),
      expiresAt: pastIso(1),
      deviceBound: true,
      restrictedOffline: true,
      version: 1,
      sessionState: { mode: "tenant", tenant: { id: "t1", slug: "bell", name: "Bell" }, user: { id: "a1", email: "admin@test.com", role: "admin" }, bootstrapRequired: false },
    });
    const result = await getOfflineAdminSession();
    expect(result).toBeNull();
  });

  it("retorna sessão admin restrita quando envelope é válido", async () => {
    mockGetEnvelope.mockResolvedValue({
      kind: "admin",
      email: "admin@test.com",
      tenantSlug: "bell",
      lastValidatedAt: new Date().toISOString(),
      expiresAt: futureIso(1),
      deviceBound: true,
      restrictedOffline: true,
      version: 1,
      sessionState: { mode: "tenant", tenant: { id: "t1", slug: "bell", name: "Bell" }, user: { id: "a1", email: "admin@test.com", role: "admin" }, bootstrapRequired: false },
    });
    const result = await getOfflineAdminSession();
    expect(result).not.toBeNull();
    expect(result?.authenticated).toBe(true);
    expect(result?.offlineRestricted).toBe(true);
  });
});

describe("persistUserSessionEnvelope", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSaveEnvelope.mockResolvedValue(undefined);
    mockClearEnvelope.mockResolvedValue(undefined);
  });

  it("limpa envelope quando sessão não está autenticada", async () => {
    await persistUserSessionEnvelope({ authenticated: false } as never);
    expect(mockClearEnvelope).toHaveBeenCalledWith("user");
    expect(mockSaveEnvelope).not.toHaveBeenCalled();
  });

  it("salva envelope com TTL de 7 dias quando autenticado", async () => {
    await persistUserSessionEnvelope({
      authenticated: true,
      email: "user@test.com",
      tenantId: "t1",
      tenantSlug: "bell",
      userId: "u1",
      role: "user",
    });
    expect(mockSaveEnvelope).toHaveBeenCalledOnce();
    const saved = mockSaveEnvelope.mock.calls[0][0];
    expect(saved.kind).toBe("user");
    expect(saved.email).toBe("user@test.com");
    // TTL ~ 7 dias a partir de agora
    const expiresAt = new Date(saved.expiresAt).getTime();
    const diffMs = expiresAt - Date.now();
    expect(diffMs).toBeGreaterThan(6 * 24 * 60 * 60 * 1000);
    expect(diffMs).toBeLessThan(8 * 24 * 60 * 60 * 1000);
  });
});

describe("clearOfflineSession", () => {
  it("delega para clearSessionEnvelope com o kind correto", async () => {
    mockClearEnvelope.mockResolvedValue(undefined);
    await clearOfflineSession("user");
    expect(mockClearEnvelope).toHaveBeenCalledWith("user");
    await clearOfflineSession("admin");
    expect(mockClearEnvelope).toHaveBeenCalledWith("admin");
  });
});
