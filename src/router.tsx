import type { ComponentType } from "react";
import { Navigate, RouterProvider, createBrowserRouter, useParams } from "react-router-dom";
import { RequireAdminAuth } from "@/components/auth/RequireAdminAuth";
import AdminLayout from "@/components/layout/AdminLayout";
import PublicLayout from "@/components/layout/PublicLayout";
import { buildTenantAdminPath } from "@/lib/tenant";
import HomePage from "@/pages/Index";

type RouteModule = {
  default: ComponentType;
};

function lazyRoute(loader: () => Promise<RouteModule>) {
  return async () => {
    const { default: Component } = await loader();
    return { Component };
  };
}

function TenantAdminNavigate({ to = "" }: { to?: string }) {
  const { tenantSlug } = useParams();
  return <Navigate to={buildTenantAdminPath(to, tenantSlug)} replace />;
}

function buildAdminChildren() {
  return [
    { index: true, lazy: lazyRoute(() => import("@/pages/admin/Dashboard")) },
    { path: "dashboard", element: <TenantAdminNavigate to="" /> },
    { path: "home", element: <TenantAdminNavigate to="" /> },
    { path: "receitas", lazy: lazyRoute(() => import("@/pages/admin/RecipeListPage")) },
    { path: "receitas/nova", lazy: lazyRoute(() => import("@/pages/admin/RecipeEditor")) },
    { path: "receitas/:id/editar", lazy: lazyRoute(() => import("@/pages/admin/RecipeEditor")) },
    { path: "categorias", lazy: lazyRoute(() => import("@/pages/admin/categories/CategoriesPage")) },
    {
      path: "pagamentos",
      children: [
        { index: true, lazy: lazyRoute(() => import("@/pages/admin/payments/DashboardPage")) },
        { path: "transacoes", lazy: lazyRoute(() => import("@/pages/admin/payments/TransactionsPage")) },
        {
          path: "transacoes/:id",
          lazy: lazyRoute(() => import("@/pages/admin/payments/TransactionDetailsPage")),
        },
        { path: "configuracoes", lazy: lazyRoute(() => import("@/pages/admin/payments/SettingsPage")) },
      ],
    },
    { path: "configuracoes", lazy: lazyRoute(() => import("@/pages/admin/SettingsPage")) },
    { path: "configuracoes/pagina-inicial", lazy: lazyRoute(() => import("@/pages/admin/HomePageSettings")) },
    { path: "*", element: <TenantAdminNavigate to="" /> },
  ];
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <PublicLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "buscar", lazy: lazyRoute(() => import("@/pages/Search")) },
      { path: "categorias/:slug", lazy: lazyRoute(() => import("@/pages/Category")) },
      { path: "receitas/:slug", lazy: lazyRoute(() => import("@/pages/RecipePage")) },
      { path: "minha-conta", lazy: lazyRoute(() => import("@/pages/AccountHome")) },
      { path: "minha-conta/minhas-receitas", element: <Navigate to="/minha-conta?tab=minhas-receitas" replace /> },
      { path: "minha-conta/compras", element: <Navigate to="/minha-conta?tab=compras" replace /> },
      { path: "minha-conta/perfil", element: <Navigate to="/minha-conta" replace /> },
      { path: "minha-conta/favoritos", lazy: lazyRoute(() => import("@/pages/Favorites")) },
      { path: "minha-conta/lista-de-compras", lazy: lazyRoute(() => import("@/pages/ShoppingListPage")) },
      { path: "carrinho", lazy: lazyRoute(() => import("@/pages/CartPage")) },
      { path: "institucional/:page", lazy: lazyRoute(() => import("@/pages/Institutional")) },
      { path: "checkout", lazy: lazyRoute(() => import("@/pages/CheckoutPage")) },
      { path: "compra/sucesso", lazy: lazyRoute(() => import("@/pages/SuccessPage")) },
      { path: "compra/pendente", lazy: lazyRoute(() => import("@/pages/PendingPage")) },
      { path: "compra/falha", lazy: lazyRoute(() => import("@/pages/FailurePage")) },
    ],
  },
  {
    path: "/pwa/entry",
    lazy: lazyRoute(() => import("@/pwa/entry/PwaEntryPage")),
  },
  {
    path: "/pwa/login",
    lazy: lazyRoute(() => import("@/pwa/pages/UserLoginPage")),
  },
  {
    path: "/pwa/admin/login",
    lazy: lazyRoute(() => import("@/pwa/pages/AdminLoginPage")),
  },
  {
    path: "/pwa/app",
    lazy: async () => {
      const { UserPwaShell } = await import("@/pwa/components/PwaShell");
      return { element: <UserPwaShell /> };
    },
    children: [
      { index: true, lazy: lazyRoute(() => import("@/pwa/pages/UserHomePage")) },
      { path: "favoritos", lazy: lazyRoute(() => import("@/pages/Favorites")) },
      { path: "lista-de-compras", lazy: lazyRoute(() => import("@/pages/ShoppingListPage")) },
      { path: "compras", element: <Navigate to="/pwa/app?tab=compras" replace /> },
    ],
  },
  {
    path: "/pwa/admin",
    element: (
      <RequireAdminAuth>
        <AdminLayout />
      </RequireAdminAuth>
    ),
    children: buildAdminChildren(),
  },
  {
    path: "/pwa/*",
    lazy: lazyRoute(() => import("@/pwa/pages/PwaNotFoundPage")),
  },
  {
    path: "/admin/login",
    lazy: lazyRoute(() => import("@/pages/admin/LoginPage")),
  },
  {
    path: "/t/:tenantSlug/admin/login",
    lazy: lazyRoute(() => import("@/pages/admin/LoginPage")),
  },
  {
    path: "/admin",
    element: (
      <RequireAdminAuth>
        <AdminLayout />
      </RequireAdminAuth>
    ),
    children: buildAdminChildren(),
  },
  {
    path: "/t/:tenantSlug/admin",
    element: (
      <RequireAdminAuth>
        <AdminLayout />
      </RequireAdminAuth>
    ),
    children: buildAdminChildren(),
  },
]);

const routerFallback = (
  <div className="flex min-h-screen items-center justify-center bg-background px-6 text-center text-sm text-muted-foreground">
    Carregando...
  </div>
);

export function AppRouter() {
  return <RouterProvider router={router} fallbackElement={routerFallback} />;
}
