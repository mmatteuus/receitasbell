// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../db/open-db", () => ({
  getOfflineDb: vi.fn(),
  runOfflineSanityCheck: vi.fn().mockResolvedValue(true),
}));

vi.mock("../events", () => ({
  emitOfflineDataChanged: vi.fn(),
  PWA_OFFLINE_DATA_CHANGED_EVENT: "pwa:offline-data-changed",
  PWA_SYNC_STATUS_EVENT: "pwa:sync-status",
}));

import { getOfflineDb } from "../db/open-db";
import { emitOfflineDataChanged } from "../events";

const mockDb = {
  get: vi.fn(),
  put: vi.fn(),
  getAllFromIndex: vi.fn(),
};

vi.mocked(getOfflineDb).mockResolvedValue(mockDb as never);

import { createConflict, resolveConflict } from "../sync/conflict-resolver";

describe("conflict-resolver", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.put.mockResolvedValue(undefined);
  });

  it("createConflict persiste conflito como pending", async () => {
    await createConflict({
      conflictId: "c-1",
      entity: "admin_recipe",
      localPayload: { title: "Local" },
      serverPayload: { title: "Server" },
    });

    expect(mockDb.put).toHaveBeenCalledOnce();
    const saved = mockDb.put.mock.calls[0][1];
    expect(saved.conflictId).toBe("c-1");
    expect(saved.resolutionState).toBe("pending");
    expect(saved.entity).toBe("admin_recipe");
    expect(vi.mocked(emitOfflineDataChanged)).toHaveBeenCalledWith("conflicts");
  });

  it("resolveConflict retorna null quando conflito não existe", async () => {
    mockDb.get.mockResolvedValue(undefined);
    const result = await resolveConflict("non-existent", "local");
    expect(result).toBeNull();
    expect(mockDb.put).not.toHaveBeenCalled();
  });

  it("resolveConflict marca conflito como resolved com a escolha correta", async () => {
    const existingConflict = {
      conflictId: "c-2",
      entity: "admin_recipe",
      localPayload: { title: "Local" },
      serverPayload: { title: "Server" },
      detectedAt: new Date().toISOString(),
      resolutionState: "pending",
      resolutionChoice: null,
    };
    mockDb.get.mockResolvedValue(existingConflict);

    const result = await resolveConflict("c-2", "server");

    expect(result?.resolutionState).toBe("resolved");
    expect(result?.resolutionChoice).toBe("server");
    expect(mockDb.put).toHaveBeenCalledOnce();
    expect(vi.mocked(emitOfflineDataChanged)).toHaveBeenCalledWith("conflicts");
  });

  it("resolveConflict suporta escolha 'local'", async () => {
    mockDb.get.mockResolvedValue({
      conflictId: "c-3",
      entity: "favorite",
      localPayload: {},
      serverPayload: {},
      detectedAt: new Date().toISOString(),
      resolutionState: "pending",
      resolutionChoice: null,
    });
    const result = await resolveConflict("c-3", "local");
    expect(result?.resolutionChoice).toBe("local");
  });

  it("resolveConflict suporta escolha 'merge'", async () => {
    mockDb.get.mockResolvedValue({
      conflictId: "c-4",
      entity: "admin_recipe",
      localPayload: {},
      serverPayload: {},
      detectedAt: new Date().toISOString(),
      resolutionState: "pending",
      resolutionChoice: null,
    });
    const result = await resolveConflict("c-4", "merge");
    expect(result?.resolutionChoice).toBe("merge");
  });
});
