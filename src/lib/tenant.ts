import {
  buildTenantAwarePwaPath,
  extractPwaTenantSlugFromPath,
  persistTenantSlugFromPwaPath,
  resolvePwaTenantSlug,
} from "@/pwa/app/tenant/pwa-tenant-path";
import {
  clearActiveTenantSlug,
  persistActiveTenantSlug,
  readActiveTenantSlug,
} from "@/pwa/app/tenant/pwa-tenant-storage";

export function extractTenantSlugFromPath(pathname: string) {
  const match = pathname.match(/^\/t\/([^/]+)(?:\/|$)/);
  return match?.[1] || null;
}

export function getStoredPwaTenantSlug() {
  return readActiveTenantSlug();
}

export function setActiveTenantSlug(tenantSlug?: string | null) {
  const normalized = tenantSlug?.trim() || "";
  if (!normalized) {
    clearActiveTenantSlug();
    return;
  }

  persistActiveTenantSlug(normalized);
}

export function rememberTenantSlugFromPath(pathname: string) {
  const tenantSlug = extractPwaTenantSlugFromPath(pathname) || extractTenantSlugFromPath(pathname);
  if (tenantSlug) {
    if (pathname.includes("/pwa")) {
      persistTenantSlugFromPwaPath(pathname);
    } else {
      setActiveTenantSlug(tenantSlug);
    }
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
  return resolvePwaTenantSlug(pathToInspect);
}

export function clearStoredPwaTenantSlug() {
  clearActiveTenantSlug();
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

export function buildTenantPwaPath(path: string, tenantSlug?: string | null) {
  return buildTenantAwarePwaPath(path, tenantSlug);
}
