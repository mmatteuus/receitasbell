import { getOfflineDb } from "../db/open-db";
import type { SessionEnvelopeKind, SessionEnvelopeRecord } from "../db/schema";
import { emitOfflineDataChanged } from "../events";

export async function getSessionEnvelope(kind: SessionEnvelopeKind) {
  const db = await getOfflineDb();
  return db.get("session_envelopes", kind);
}

export async function saveSessionEnvelope(record: SessionEnvelopeRecord) {
  const db = await getOfflineDb();
  await db.put("session_envelopes", record, record.kind);
  emitOfflineDataChanged("session_envelopes");
  return record;
}

export async function clearSessionEnvelope(kind: SessionEnvelopeKind) {
  const db = await getOfflineDb();
  await db.delete("session_envelopes", kind);
  emitOfflineDataChanged("session_envelopes");
}

export async function clearAllSessionEnvelopes() {
  const db = await getOfflineDb();
  await Promise.all([
    db.delete("session_envelopes", "user"),
    db.delete("session_envelopes", "admin"),
  ]);
  emitOfflineDataChanged("session_envelopes");
}
