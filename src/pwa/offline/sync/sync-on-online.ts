import { syncNow } from "./sync-engine";

let onlineListenerAttached = false;

export function attachSyncOnOnline() {
  if (typeof window === "undefined" || onlineListenerAttached) {
    return;
  }

  const handler = () => {
    void syncNow();
  };

  window.addEventListener("online", handler);
  onlineListenerAttached = true;
}
