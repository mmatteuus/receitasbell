const KEY = "rb_active_tenant_slug";

export function persistActiveTenantSlug(slug: string) {
  if (typeof window === "undefined") {
    return;
  }

  const normalized = slug.trim();
  if (!normalized) {
    window.localStorage.removeItem(KEY);
    return;
  }

  window.localStorage.setItem(KEY, normalized);
}

export function readActiveTenantSlug() {
  if (typeof window === "undefined") {
    return null;
  }

  const value = window.localStorage.getItem(KEY);
  return value?.trim() ? value : null;
}

export function clearActiveTenantSlug() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(KEY);
}
