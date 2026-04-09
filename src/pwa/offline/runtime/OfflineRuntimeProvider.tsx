import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { runOfflineSanityCheck } from "../db/open-db";
import { attachSyncOnOnline } from "../sync/sync-on-online";
import { attachSyncOnResume } from "../sync/sync-on-resume";
import { syncNow } from "../sync/sync-engine";

type SyncStatus = "idle" | "syncing" | "error";

type OfflineRuntimeContextValue = {
  syncCenterOpen: boolean;
  openSyncCenter: () => void;
  closeSyncCenter: () => void;
  syncNow: () => Promise<void>;
  syncStatus: SyncStatus;
};

const OfflineRuntimeContext = createContext<OfflineRuntimeContextValue>({
  syncCenterOpen: false,
  openSyncCenter: () => undefined,
  closeSyncCenter: () => undefined,
  syncNow: async () => undefined,
  syncStatus: "idle",
});

export function useOfflineRuntime() {
  return useContext(OfflineRuntimeContext);
}

export function OfflineRuntimeProvider({ children }: { children: React.ReactNode }) {
  const [syncCenterOpen, setSyncCenterOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");

  useEffect(() => {
    // Sanity check do DB na montagem
    void runOfflineSanityCheck().catch(() => undefined);

    // Listeners de sync automático
    attachSyncOnOnline();
    attachSyncOnResume();
  }, []);

  const handleSyncNow = useCallback(async () => {
    setSyncStatus("syncing");
    try {
      await syncNow();
      setSyncStatus("idle");
    } catch {
      setSyncStatus("error");
    }
  }, []);

  return (
    <OfflineRuntimeContext.Provider
      value={{
        syncCenterOpen,
        openSyncCenter: () => setSyncCenterOpen(true),
        closeSyncCenter: () => setSyncCenterOpen(false),
        syncNow: handleSyncNow,
        syncStatus,
      }}
    >
      {children}
    </OfflineRuntimeContext.Provider>
  );
}
