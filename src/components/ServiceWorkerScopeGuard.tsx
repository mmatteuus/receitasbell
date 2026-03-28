import { useEffect } from "react";
import { logger } from "@/lib/logger";

function normalizePathname(pathname: string) {
  if (!pathname) {
    return "/";
  }

  const normalized = pathname.replace(/\/+$/, "");
  return normalized || "/";
}

function isPathInsideScope(currentPath: string, scopePath: string) {
  if (scopePath === "/") {
    return true;
  }

  return currentPath === scopePath || currentPath.startsWith(`${scopePath}/`);
}

export function ServiceWorkerScopeGuard() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    const currentPath = normalizePathname(window.location.pathname);

    void navigator.serviceWorker
      .getRegistrations()
      .then((registrations) => {
        registrations.forEach((registration) => {
          let scopePath = "/";
          try {
            scopePath = normalizePathname(new URL(registration.scope).pathname);
          } catch (error) {
            logger.error("pwa.scope_guard.parse_scope", error);
            return;
          }

          if (isPathInsideScope(currentPath, scopePath)) {
            return;
          }

          void registration.unregister().catch((error) => {
            logger.error("pwa.scope_guard.unregister", error, {
              currentPath,
              scopePath,
            });
          });
        });
      })
      .catch((error) => {
        logger.error("pwa.scope_guard.get_registrations", error);
      });
  }, []);

  return null;
}
