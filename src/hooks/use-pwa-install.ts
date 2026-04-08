import { useCallback, useEffect, useMemo, useState } from "react";

// Minimal typing for the install prompt event (not part of the standard TS lib DOM types).
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export function usePwaInstall() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    function onBeforeInstallPrompt(event: Event) {
      // Keep the event so we can trigger it from an explicit user gesture (button click).
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
    }

    function onAppInstalled() {
      setDeferred(null);
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt as EventListener);
    window.addEventListener("appinstalled", onAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt as EventListener);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  const canInstall = useMemo(() => Boolean(deferred), [deferred]);

  const promptInstall = useCallback(async () => {
    if (!deferred) return { outcome: "unavailable" as const };
    await deferred.prompt();
    const choice = await deferred.userChoice;
    setDeferred(null);
    return choice;
  }, [deferred]);

  return { canInstall, promptInstall };
}

