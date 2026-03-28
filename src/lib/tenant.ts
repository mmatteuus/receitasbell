const PWA_ACTIVE_TENANT_KEY = "rb_pwa_active_tenant_slug";

export function extractTenantSlugFromPath(pathname: string) {
  const match = pathname.match(/^\/t\/([^/]+)(?:\/|$)/);
  return match?.[1] || null;
}

export function getStoredPwaTenantSlug() {
  if (typeof window === "undefined") {
    return null;
  }

  const stored = window.localStorage.getItem(PWA_ACTIVE_TENANT_KEY);
  return stored?.trim() ? stored : null;
}

export function setActiveTenantSlug(tenantSlug?: string | null) {
  if (typeof window === "undefined") {
    return;
  }

  const normalized = tenantSlug?.trim() || "";
  if (!normalized) {
    window.localStorage.removeItem(PWA_ACTIVE_TENANT_KEY);
    return;
  }

  window.localStorage.setItem(PWA_ACTIVE_TENANT_KEY, normalized);
}

export function rememberTenantSlugFromPath(pathname: string) {
  const tenantSlug = extractTenantSlugFromPath(pathname);
  if (tenantSlug) {
    setActiveTenantSlug(tenantSlug);
  }
  return tenantSlug;
}

export function getCurrentTenantSlug(pathname?: string | null) {
  const pathToInspect =
    typeof pathname === "string"
      ? pathname
      : typeof window !== "undefined"
        ? window.location.pathname
        : null;

  if (!pathToInspect) return getStoredPwaTenantSlug();

  const pathTenant = extractTenantSlugFromPath(pathToInspect);
  if (pathTenant) return pathTenant;
  return getStoredPwaTenantSlug();
}

export function clearStoredPwaTenantSlug() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(PWA_ACTIVE_TENANT_KEY);
}

export function buildTenantPath(path: string, tenantSlug?: string | null) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  if (!tenantSlug) {
    return normalizedPath;
  }
  if (normalizedPath === "/") {
    return `/t/${tenantSlug}`;
  }
  return `/t/${tenantSlug}${normalizedPath}`;
}

export function buildTenantAdminPath(path = "", tenantSlug?: string | null) {
  const base = tenantSlug ? `/t/${tenantSlug}/admin` : "/admin";
  const normalized = path.replace(/^\/+/, "");
  return normalized ? `${base}/${normalized}` : base;
}
