import { useEffect, useState } from "react";
import { fetchMe } from "@/lib/api/identity";
import { getOfflineUserSession } from "@/pwa/offline/auth/offline-auth";

type PwaGateState =
  | { status: "loading" }
  | { status: "authenticated" }
  | { status: "offline_locked" }
  | { status: "unauthenticated" };

export function usePwaSessionGate() {
  const [state, setState] = useState<PwaGateState>({ status: "loading" });

  useEffect(() => {
    let active = true;

    async function run() {
      try {
        const user = await fetchMe();
        if (!active) return;

        if (user?.email) {
          // fetchMe já persiste o envelope via persistUserSessionEnvelope internamente
          setState({ status: "authenticated" });
          return;
        }

        if (typeof navigator !== "undefined" && !navigator.onLine) {
          // Tentar sessão offline antes de bloquear
          const offlineSession = await getOfflineUserSession();
          if (!active) return;
          if (offlineSession) {
            setState({ status: "authenticated" });
            return;
          }
          setState({ status: "offline_locked" });
          return;
        }

        setState({ status: "unauthenticated" });
      } catch {
        if (!active) return;

        if (typeof navigator !== "undefined" && !navigator.onLine) {
          // Rede falhou: tentar sessão offline
          try {
            const offlineSession = await getOfflineUserSession();
            if (!active) return;
            if (offlineSession) {
              setState({ status: "authenticated" });
              return;
            }
          } catch {
            // IndexedDB pode estar indisponível em contexto restrito
          }
          setState({ status: "offline_locked" });
          return;
        }

        setState({ status: "unauthenticated" });
      }
    }

    void run();
    return () => {
      active = false;
    };
  }, []);

  return state;
}
