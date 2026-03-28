import { useEffect, useState } from "react";
import { getPendingOutboxCount } from "../outbox/outbox-store";
import { PWA_OFFLINE_DATA_CHANGED_EVENT, PWA_SYNC_STATUS_EVENT } from "../events";

export function usePendingSyncCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let active = true;

    async function refresh() {
      const nextCount = await getPendingOutboxCount();
      if (active) {
        setCount(nextCount);
      }
    }

    void refresh();

    const handleRefresh = () => {
      void refresh();
    };

    window.addEventListener(PWA_OFFLINE_DATA_CHANGED_EVENT, handleRefresh);
    window.addEventListener(PWA_SYNC_STATUS_EVENT, handleRefresh);

    return () => {
      active = false;
      window.removeEventListener(PWA_OFFLINE_DATA_CHANGED_EVENT, handleRefresh);
      window.removeEventListener(PWA_SYNC_STATUS_EVENT, handleRefresh);
    };
  }, []);

  return count;
}
