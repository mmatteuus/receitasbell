import type { ProfileSnapshotRecord } from "../db/schema";
import { getOfflineDb } from "../db/open-db";
import { emitOfflineDataChanged } from "../events";

export async function getProfileSnapshot(scopeKey: string) {
  const db = await getOfflineDb();
  return db.get("profile_snapshots", scopeKey);
}

export async function saveProfileSnapshot(snapshot: ProfileSnapshotRecord) {
  const db = await getOfflineDb();
  await db.put("profile_snapshots", snapshot, snapshot.scopeKey);
  emitOfflineDataChanged("profile_snapshots");
  return snapshot;
}
