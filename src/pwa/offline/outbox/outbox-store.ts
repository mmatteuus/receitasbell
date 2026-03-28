import type { OutboxRecord, OutboxSyncState } from "../db/schema";
import { getOfflineDb } from "../db/open-db";
import { emitOfflineDataChanged } from "../events";

export async function listOutboxRecords(syncState?: OutboxSyncState) {
  const db = await getOfflineDb();
  const items = syncState
    ? await db.getAllFromIndex("outbox", "by_syncState", syncState)
    : await db.getAll("outbox");

  return items.sort((left, right) => left.createdAt.localeCompare(right.createdAt));
}

export async function getOutboxRecord(opId: string) {
  const db = await getOfflineDb();
  return db.get("outbox", opId);
}

export async function getPendingOutboxCount() {
  const db = await getOfflineDb();
  const pending = await db.getAllFromIndex("outbox", "by_syncState", "pending");
  const failed = await db.getAllFromIndex("outbox", "by_syncState", "failed");
  const conflict = await db.getAllFromIndex("outbox", "by_syncState", "conflict");
  return pending.length + failed.length + conflict.length;
}

export async function putOutboxRecord(record: OutboxRecord) {
  const db = await getOfflineDb();
  await db.put("outbox", record, record.opId);
  emitOfflineDataChanged("outbox");
  return record;
}

export async function deleteOutboxRecord(opId: string) {
  const db = await getOfflineDb();
  await db.delete("outbox", opId);
  emitOfflineDataChanged("outbox");
}

export async function updateOutboxRecord(opId: string, patch: Partial<OutboxRecord>) {
  const db = await getOfflineDb();
  const current = await db.get("outbox", opId);
  if (!current) {
    return null;
  }

  const next = {
    ...current,
    ...patch,
  };
  await db.put("outbox", next, opId);
  emitOfflineDataChanged("outbox");
  return next;
}
