import type { OutboxRecord } from "../db/schema";
import { putOutboxRecord } from "./outbox-store";

export async function enqueueOutboxOperation(
  input: Omit<OutboxRecord, "retryCount" | "createdAt" | "syncState"> & {
    retryCount?: number;
    createdAt?: string;
  },
) {
  return putOutboxRecord({
    ...input,
    retryCount: input.retryCount ?? 0,
    createdAt: input.createdAt ?? new Date().toISOString(),
    syncState: "pending",
  });
}
