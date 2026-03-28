import { useState } from "react";
import { syncNow } from "../sync/sync-engine";

export function useSyncNow() {
  const [running, setRunning] = useState(false);

  async function run() {
    setRunning(true);
    try {
      await syncNow();
    } finally {
      setRunning(false);
    }
  }

  return {
    syncNow: run,
    syncing: running,
  };
}
