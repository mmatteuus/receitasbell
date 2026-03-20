export function extractTenantSlugFromPath(pathname: string) {
  const match = pathname.match(/^\/t\/([^/]+)(?:\/|$)/);
  return match?.[1] || null;
}

export function getCurrentTenantSlug() {
  if (typeof window === "undefined") {
    return null;
  }
  return extractTenantSlugFromPath(window.location.pathname);
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
