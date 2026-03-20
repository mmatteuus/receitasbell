import { Navigate, useLocation } from "react-router-dom";
import { buildTenantAdminPath, extractTenantSlugFromPath } from "@/lib/tenant";

function normalizeLegacyAdminPath(pathname: string) {
  const tenantSlug = extractTenantSlugFromPath(pathname);
  const adminBase = buildTenantAdminPath("", tenantSlug);
  const normalize = (value: string) => buildTenantAdminPath(value, tenantSlug);
  const tenantAwarePath = tenantSlug ? pathname.replace(`/t/${tenantSlug}`, "") : pathname;

  if (tenantAwarePath === "/admin/dashboard" || tenantAwarePath === "/admin/home") {
    return adminBase;
  }

  if (tenantAwarePath === "/admin/settings") {
    return normalize("configuracoes");
  }

  if (tenantAwarePath === "/admin/settings/home") {
    return normalize("configuracoes/pagina-inicial");
  }

  if (tenantAwarePath === "/admin/recipes") {
    return normalize("receitas");
  }

  if (tenantAwarePath === "/admin/recipes/new") {
    return normalize("receitas/nova");
  }

  const recipeEditMatch = tenantAwarePath.match(/^\/admin\/recipes\/([^/]+)\/edit$/);
  if (recipeEditMatch) {
    return normalize(`receitas/${recipeEditMatch[1]}/editar`);
  }

  if (tenantAwarePath === "/admin/categories") {
    return normalize("categorias");
  }

  if (
    tenantAwarePath === "/admin/payments" ||
    tenantAwarePath === "/admin/payments/dashboard" ||
    tenantAwarePath === "/admin/pagamentos/dashboard"
  ) {
    return normalize("pagamentos");
  }

  if (tenantAwarePath === "/admin/payments/transactions") {
    return normalize("pagamentos/transacoes");
  }

  const paymentDetailsMatch = tenantAwarePath.match(/^\/admin\/payments\/transactions\/([^/]+)$/);
  if (paymentDetailsMatch) {
    return normalize(`pagamentos/transacoes/${paymentDetailsMatch[1]}`);
  }

  if (tenantAwarePath === "/admin/payments/settings") {
    return normalize("pagamentos/configuracoes");
  }

  return adminBase;
}

export function LegacyAdminRedirect() {
  const location = useLocation();
  const targetPath = normalizeLegacyAdminPath(location.pathname);
  const target = `${targetPath}${location.search}${location.hash}`;

  return <Navigate to={target} replace />;
}
