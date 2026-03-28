import { useEffect, useState } from "react";
import { isStandalonePwa } from "../runtime";

function readOnlineState() {
  if (typeof navigator === "undefined") {
    return true;
  }

  return navigator.onLine;
}

export function useOfflineStatus() {
  const [online, setOnline] = useState(readOnlineState);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return {
    online,
    offline: !online,
    standalone: isStandalonePwa(),
  };
}
