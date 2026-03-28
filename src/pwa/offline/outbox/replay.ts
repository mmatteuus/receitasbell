import { ApiClientError } from "@/lib/api/client";
import { emitSyncStatus } from "../events";
import { MAX_AUTOMATIC_SYNC_RETRIES, computeNextRetryAt } from "./policies";
import {
  deleteOutboxRecord,
  listOutboxRecords,
  updateOutboxRecord,
} from "./outbox-store";

let replayPromise: Promise<void> | null = null;

function isOnline() {
  if (typeof navigator === "undefined") {
    return true;
  }
  return navigator.onLine;
}

async function executeOperation(entity: string, action: string, opId: string) {
  if (entity === "favorite") {
    const { replayFavoriteOperation } = await import("../repos/favorites-offline-repo");
    await replayFavoriteOperation(opId, action);
    return;
  }

  if (entity === "shopping") {
    const { replayShoppingOperation } = await import("../repos/shopping-offline-repo");
    await replayShoppingOperation(opId, action);
    return;
  }

  if (entity === "admin_recipe_draft") {
    const { replayAdminRecipeDraftOperation } = await import("../repos/admin-recipes-offline-repo");
    await replayAdminRecipeDraftOperation(opId, action);
    return;
  }

  throw new Error(`Unsupported outbox entity: ${entity}`);
}

async function replayOutboxInternal() {
  if (!isOnline()) {
    return;
  }

  const operations = (await listOutboxRecords()).filter((operation) => {
    if (!operation.nextRetryAt) {
      return operation.syncState === "pending";
    }

    return new Date(operation.nextRetryAt).getTime() <= Date.now();
  });

  if (!operations.length) {
    emitSyncStatus({ state: "idle", pendingCount: 0 });
    return;
  }

  for (const operation of operations) {
    emitSyncStatus({
      state: "running",
      entity: operation.entity,
    });

    await updateOutboxRecord(operation.opId, {
      syncState: "processing",
      errorMessage: null,
    });

    try {
      await executeOperation(operation.entity, operation.action, operation.opId);
      await deleteOutboxRecord(operation.opId);
      emitSyncStatus({
        state: "success",
        entity: operation.entity,
      });
    } catch (error) {
      const retryCount = operation.retryCount + 1;
      const nextState =
        error instanceof ApiClientError && error.status === 409
          ? "conflict"
          : retryCount >= MAX_AUTOMATIC_SYNC_RETRIES
            ? "failed"
            : "pending";

      await updateOutboxRecord(operation.opId, {
        retryCount,
        syncState: nextState,
        nextRetryAt: nextState === "pending" ? computeNextRetryAt(retryCount) : null,
        errorMessage: error instanceof Error ? error.message : "Erro ao sincronizar",
      });

      emitSyncStatus({
        state: "error",
        entity: operation.entity,
        message: error instanceof Error ? error.message : "Erro ao sincronizar",
      });
    }
  }
}

export function requestOutboxReplay() {
  if (replayPromise) {
    return replayPromise;
  }

  replayPromise = replayOutboxInternal().finally(() => {
    replayPromise = null;
  });

  return replayPromise;
}
