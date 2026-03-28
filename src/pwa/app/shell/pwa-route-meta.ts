import { stripTenantFromPwaPath } from "@/pwa/app/tenant/pwa-tenant-path";

export const PWA_ROUTE_META = {
  "/pwa/app": { title: "Receitas Bell", isRoot: true },
  "/pwa/app/favoritos": { title: "Favoritos", isRoot: true },
  "/pwa/app/lista-de-compras": { title: "Lista de Compras", isRoot: true },
  "/pwa/app/compras": { title: "Compras", isRoot: true },
  "/pwa/app/buscar": { title: "Buscar", isRoot: false },
} as const;

type PwaRouteMeta = {
  title: string;
  isRoot: boolean;
  normalizedPathname: string;
};

function matchDynamicRoute(pathname: string): PwaRouteMeta | null {
  if (/^\/pwa\/app\/receitas\/[^/]+$/.test(pathname)) {
    return {
      title: "Receita",
      isRoot: false,
      normalizedPathname: pathname,
    };
  }

  return null;
}

export function resolvePwaRouteMeta(pathname: string): PwaRouteMeta {
  const normalizedPathname = stripTenantFromPwaPath(pathname);
  const staticMeta = PWA_ROUTE_META[normalizedPathname as keyof typeof PWA_ROUTE_META];

  if (staticMeta) {
    return {
      ...staticMeta,
      normalizedPathname,
    };
  }

  const dynamicMeta = matchDynamicRoute(normalizedPathname);
  if (dynamicMeta) {
    return dynamicMeta;
  }

  return {
    title: "Receitas Bell",
    isRoot: false,
    normalizedPathname,
  };
}
