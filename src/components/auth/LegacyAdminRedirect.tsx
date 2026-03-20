import { Navigate, useLocation } from "react-router-dom";

function normalizeLegacyAdminPath(pathname: string) {
  if (pathname === "/admin/dashboard" || pathname === "/admin/home") {
    return "/admin";
  }

  if (pathname === "/admin/settings") {
    return "/admin/configuracoes";
  }

  if (pathname === "/admin/settings/home") {
    return "/admin/configuracoes/pagina-inicial";
  }

  if (pathname === "/admin/recipes") {
    return "/admin/receitas";
  }

  if (pathname === "/admin/recipes/new") {
    return "/admin/receitas/nova";
  }

  const recipeEditMatch = pathname.match(/^\/admin\/recipes\/([^/]+)\/edit$/);
  if (recipeEditMatch) {
    return `/admin/receitas/${recipeEditMatch[1]}/editar`;
  }

  if (pathname === "/admin/categories") {
    return "/admin/categorias";
  }

  if (pathname === "/admin/payments" || pathname === "/admin/payments/dashboard" || pathname === "/admin/pagamentos/dashboard") {
    return "/admin/pagamentos";
  }

  if (pathname === "/admin/payments/transactions") {
    return "/admin/pagamentos/transacoes";
  }

  const paymentDetailsMatch = pathname.match(/^\/admin\/payments\/transactions\/([^/]+)$/);
  if (paymentDetailsMatch) {
    return `/admin/pagamentos/transacoes/${paymentDetailsMatch[1]}`;
  }

  if (pathname === "/admin/payments/settings") {
    return "/admin/pagamentos/configuracoes";
  }

  return "/admin";
}

export function LegacyAdminRedirect() {
  const location = useLocation();
  const targetPath = normalizeLegacyAdminPath(location.pathname);
  const target = `${targetPath}${location.search}${location.hash}`;

  return <Navigate to={target} replace />;
}
