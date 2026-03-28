const PWA_REDIRECT_KEY = "rb_pwa_redirect";

export function savePwaRedirect(path: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(PWA_REDIRECT_KEY, path);
}

export function readPwaRedirect() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.sessionStorage.getItem(PWA_REDIRECT_KEY);
}

export function clearPwaRedirect() {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(PWA_REDIRECT_KEY);
}
