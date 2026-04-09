// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock da camada de DB
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

const mockDb = {
  get: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  getAll: vi.fn(),
  getAllFromIndex: vi.fn(),
  transaction: vi.fn(),
};

vi.mocked(getOfflineDb).mockResolvedValue(mockDb as never);

import { putOutboxRecord, listOutboxRecords, getOutboxRecord, getPendingOutboxCount, deleteOutboxRecord } from "../outbox/outbox-store";

describe("outbox-store", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.put.mockResolvedValue(undefined);
    mockDb.delete.mockResolvedValue(undefined);
  });

  it("putOutboxRecord persiste o registro com syncState pending", async () => {
    const record = {
      opId: "op-1",
      entity: "favorite",
      action: "add",
      payload: { recipeId: "rec-1" },
      retryCount: 0,
      createdAt: new Date().toISOString(),
      syncState: "pending" as const,
    };
    await putOutboxRecord(record);
    expect(mockDb.put).toHaveBeenCalledWith("outbox", record, "op-1");
  });

  it("deleteOutboxRecord remove o registro por opId", async () => {
    await deleteOutboxRecord("op-123");
    expect(mockDb.delete).toHaveBeenCalledWith("outbox", "op-123");
  });

  it("listOutboxRecords retorna lista ordenada por createdAt", async () => {
    const records = [
      { opId: "b", entity: "shopping", action: "create", payload: {}, retryCount: 0, createdAt: "2024-02-02T00:00:00Z", syncState: "pending" as const },
      { opId: "a", entity: "favorite", action: "add", payload: {}, retryCount: 0, createdAt: "2024-01-01T00:00:00Z", syncState: "pending" as const },
    ];
    mockDb.getAll.mockResolvedValue(records);
    const result = await listOutboxRecords();
    expect(result[0].opId).toBe("a");
    expect(result[1].opId).toBe("b");
  });

  it("getPendingOutboxCount soma pending + failed + conflict", async () => {
    mockDb.getAllFromIndex
      .mockResolvedValueOnce([{ opId: "1" }, { opId: "2" }]) // pending
      .mockResolvedValueOnce([{ opId: "3" }]) // failed
      .mockResolvedValueOnce([]); // conflict
    const count = await getPendingOutboxCount();
    expect(count).toBe(3);
  });

  it("getOutboxRecord retorna registro pelo opId", async () => {
    const record = { opId: "op-x", entity: "favorite", action: "add", payload: {}, retryCount: 0, createdAt: "2024-01-01T00:00:00Z", syncState: "pending" as const };
    mockDb.get.mockResolvedValue(record);
    const result = await getOutboxRecord("op-x");
    expect(result).toEqual(record);
    expect(mockDb.get).toHaveBeenCalledWith("outbox", "op-x");
  });
});
