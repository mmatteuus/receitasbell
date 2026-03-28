import { useEffect, useState } from "react";
import { getOfflineDb } from "../db/open-db";
import { PWA_OFFLINE_DATA_CHANGED_EVENT } from "../events";
import { resolveConflict } from "../sync/conflict-resolver";

export function useConflictCenter() {
  const [conflicts, setConflicts] = useState<Array<{
    conflictId: string;
    entity: string;
    detectedAt: string;
    localPayload: Record<string, unknown>;
    serverPayload: Record<string, unknown>;
  }>>([]);

  useEffect(() => {
    let active = true;

    async function refresh() {
      const db = await getOfflineDb();
      const pending = await db.getAllFromIndex("conflicts", "by_resolutionState", "pending");
      if (active) {
        setConflicts(pending);
      }
    }

    void refresh();
    const handleRefresh = () => {
      void refresh();
    };

    window.addEventListener(PWA_OFFLINE_DATA_CHANGED_EVENT, handleRefresh);
    return () => {
      active = false;
      window.removeEventListener(PWA_OFFLINE_DATA_CHANGED_EVENT, handleRefresh);
    };
  }, []);

  return {
    conflicts,
    resolveConflict,
  };
}
