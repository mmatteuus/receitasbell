import { syncNow } from "./sync-engine";

let resumeListenersAttached = false;

export function attachSyncOnResume() {
  if (typeof window === "undefined" || resumeListenersAttached) {
    return;
  }

  const handler = () => {
    if (document.visibilityState === "visible") {
      void syncNow();
    }
  };

  document.addEventListener("visibilitychange", handler);
  window.addEventListener("focus", handler);
  resumeListenersAttached = true;
}
