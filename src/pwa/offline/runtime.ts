export function isPwaRuntimePath(pathname?: string | null) {
  if (typeof pathname === "string") {
    return pathname.startsWith("/pwa/");
  }

  if (typeof window === "undefined") {
    return false;
  }

  return window.location.pathname.startsWith("/pwa/");
}

export function isTenantScopedPwaPath(pathname?: string | null) {
  if (typeof pathname === "string") {
    return /^\/t\/[^/]+\/pwa(?:\/|$)/.test(pathname);
  }

  if (typeof window === "undefined") {
    return false;
  }

  return /^\/t\/[^/]+\/pwa(?:\/|$)/.test(window.location.pathname);
}

export function isStandalonePwa() {
  if (typeof window === "undefined") {
    return false;
  }

  return (
    window.matchMedia("(display-mode: standalone)").matches
    || (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}
