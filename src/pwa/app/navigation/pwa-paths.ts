export type PwaRouteKey =
  | "entry"
  | "login"
  | "verify"
  | "adminLogin"
  | "home"
  | "favorites"
  | "shopping"
  | "purchases"
  | "search"
  | "recipe";

function normalizeTenantSlug(tenantSlug?: string | null) {
  const normalized = tenantSlug?.trim();
  return normalized ? normalized : null;
}

export function buildPwaPath(
  key: PwaRouteKey,
  params?: { tenantSlug?: string | null; slug?: string },
) {
  const tenantSlug = normalizeTenantSlug(params?.tenantSlug);
  const base = tenantSlug ? `/t/${tenantSlug}/pwa` : "/pwa";

  switch (key) {
    case "entry":
      return `${base}/entry`;
    case "login":
      return `${base}/login`;
    case "verify":
      return `${base}/auth/verify`;
    case "adminLogin":
      return `${base}/admin/login`;
    case "home":
      return `${base}/app`;
    case "favorites":
      return `${base}/app/favoritos`;
    case "shopping":
      return `${base}/app/lista-de-compras`;
    case "purchases":
      return `${base}/app/compras`;
    case "search":
      return `${base}/app/buscar`;
    case "recipe":
      return `${base}/app/receitas/${params?.slug ?? ""}`;
    default:
      return `${base}/app`;
  }
}

export function buildPwaAdminPath(
  params?: { tenantSlug?: string | null; path?: string },
) {
  const tenantSlug = normalizeTenantSlug(params?.tenantSlug);
  const base = tenantSlug ? `/t/${tenantSlug}/pwa/admin` : "/pwa/admin";
  const suffix = params?.path?.replace(/^\/+/, "") || "";
  return suffix ? `${base}/${suffix}` : base;
}
