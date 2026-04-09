import { createContext, useContext } from "react";

export type SyncStatus = "idle" | "syncing" | "error";

export type OfflineRuntimeContextValue = {
  syncCenterOpen: boolean;
  openSyncCenter: () => void;
  closeSyncCenter: () => void;
  syncNow: () => Promise<void>;
  syncStatus: SyncStatus;
};

export const OfflineRuntimeContext = createContext<OfflineRuntimeContextValue>({
  syncCenterOpen: false,
  openSyncCenter: () => undefined,
  closeSyncCenter: () => undefined,
  syncNow: async () => undefined,
  syncStatus: "idle",
});

export function useOfflineRuntime() {
  return useContext(OfflineRuntimeContext);
}
