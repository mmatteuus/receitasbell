export const PWA_OFFLINE_DATA_CHANGED_EVENT = "rb:pwa-offline-data-changed";
export const PWA_SYNC_STATUS_EVENT = "rb:pwa-sync-status";

export type SyncStatusDetail = {
  state: "idle" | "running" | "success" | "error";
  entity?: string;
  message?: string;
  pendingCount?: number;
};

function emitWindowEvent<T>(eventName: string, detail?: T) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent(eventName, { detail }));
}

export function emitOfflineDataChanged(scope = "all") {
  emitWindowEvent(PWA_OFFLINE_DATA_CHANGED_EVENT, { scope, at: Date.now() });
}

export function emitSyncStatus(detail: SyncStatusDetail) {
  emitWindowEvent(PWA_SYNC_STATUS_EVENT, detail);
}
