import {
  persistActiveTenantSlug,
  readActiveTenantSlug,
} from "@/pwa/app/tenant/pwa-tenant-storage";

const TENANT_PWA_PATTERN = /^\/t\/([^/]+)\/pwa(?:\/|$)/;

export function extractPwaTenantSlugFromPath(pathname: string) {
  const match = pathname.match(TENANT_PWA_PATTERN);
  return match?.[1] || null;
}

export function resolvePwaTenantSlug(pathname?: string | null) {
  const path =
    typeof pathname === "string"
      ? pathname
      : typeof window !== "undefined"
        ? window.location.pathname
        : null;

  if (!path) {
    return readActiveTenantSlug() || "receitasbell";
  }

  const fromPath = extractPwaTenantSlugFromPath(path);
  if (fromPath) {
    return fromPath;
  }

  // Se estiver no /pwa/login direto, tenta o cache ou fallback para o principal
  return readActiveTenantSlug() || "receitasbell";
}

export function persistTenantSlugFromPwaPath(pathname: string) {
  const tenantSlug = extractPwaTenantSlugFromPath(pathname);
  if (tenantSlug) {
    persistActiveTenantSlug(tenantSlug);
  }
  return tenantSlug;
}

export function stripTenantFromPwaPath(pathname: string) {
  return pathname.replace(/^\/t\/[^/]+(?=\/pwa(?:\/|$))/, "");
}

export function buildTenantAwarePwaPath(path: string, tenantSlug?: string | null) {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const withoutTenant = stripTenantFromPwaPath(normalized);
  const resolvedTenantSlug = tenantSlug?.trim() || null;

  if (!resolvedTenantSlug) {
    return withoutTenant;
  }

  if (withoutTenant.startsWith("/pwa/") || withoutTenant === "/pwa") {
    return `/t/${resolvedTenantSlug}${withoutTenant}`;
  }

  return `/t/${resolvedTenantSlug}${withoutTenant}`;
}
