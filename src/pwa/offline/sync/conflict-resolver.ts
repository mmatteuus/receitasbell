import { getOfflineDb } from "../db/open-db";
import { emitOfflineDataChanged } from "../events";

export async function createConflict(input: {
  conflictId: string;
  entity: string;
  localPayload: Record<string, unknown>;
  serverPayload: Record<string, unknown>;
}) {
  const db = await getOfflineDb();
  await db.put("conflicts", {
    conflictId: input.conflictId,
    entity: input.entity,
    localPayload: input.localPayload,
    serverPayload: input.serverPayload,
    detectedAt: new Date().toISOString(),
    resolutionState: "pending",
    resolutionChoice: null,
  }, input.conflictId);
  emitOfflineDataChanged("conflicts");
}

export async function resolveConflict(
  conflictId: string,
  resolutionChoice: "local" | "server" | "merge",
) {
  const db = await getOfflineDb();
  const current = await db.get("conflicts", conflictId);
  if (!current) {
    return null;
  }

  const next = {
    ...current,
    resolutionState: "resolved" as const,
    resolutionChoice,
  };

  await db.put("conflicts", next, conflictId);
  emitOfflineDataChanged("conflicts");
  return next;
}
