import { useEffect, useState } from "react";
import { fetchMe } from "@/lib/api/identity";

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
          setState({ status: "authenticated" });
          return;
        }

        if (typeof navigator !== "undefined" && !navigator.onLine) {
          setState({ status: "offline_locked" });
          return;
        }

        setState({ status: "unauthenticated" });
      } catch {
        if (!active) return;

        if (typeof navigator !== "undefined" && !navigator.onLine) {
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
