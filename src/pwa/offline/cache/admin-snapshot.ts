import type { AdminSnapshotRecord } from "../db/schema";
import { getOfflineDb } from "../db/open-db";
import { emitOfflineDataChanged } from "../events";

export async function getAdminSnapshot(tenantSlug: string) {
  const db = await getOfflineDb();
  return db.get("admin_snapshots", tenantSlug);
}

export async function saveAdminSnapshot(snapshot: AdminSnapshotRecord) {
  const db = await getOfflineDb();
  const current = await db.get("admin_snapshots", snapshot.tenantSlug);
  await db.put("admin_snapshots", {
    ...current,
    ...snapshot,
  }, snapshot.tenantSlug);
  emitOfflineDataChanged("admin_snapshots");
  return snapshot;
}
