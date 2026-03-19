import type { ComponentType } from "react";
import { Navigate, createBrowserRouter } from "react-router-dom";
import { RequireAdminAuth } from "@/components/auth/RequireAdminAuth";
import AdminLayout from "@/components/layout/AdminLayout";
import PublicLayout from "@/components/layout/PublicLayout";
import HomePage from "@/pages/public/HomePage";

type RouteModule = {
  default: ComponentType;
};

function lazyRoute(loader: () => Promise<RouteModule>) {
  return async () => {
    const { default: Component } = await loader();
    return { Component };
  };
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <PublicLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "buscar", lazy: lazyRoute(() => import("@/pages/public/SearchPage")) },
      { path: "categorias/:slug", lazy: lazyRoute(() => import("@/pages/public/CategoryPage")) },
      { path: "receitas/:slug", lazy: lazyRoute(() => import("@/pages/public/RecipePage")) },
      { path: "minha-conta", lazy: lazyRoute(() => import("@/pages/public/AccountPage")) },
      { path: "minha-conta/minhas-receitas", element: <Navigate to="/minha-conta?tab=minhas-receitas" replace /> },
      { path: "minha-conta/compras", element: <Navigate to="/minha-conta?tab=compras" replace /> },
      { path: "minha-conta/perfil", element: <Navigate to="/minha-conta" replace /> },
      { path: "minha-conta/favoritos", lazy: lazyRoute(() => import("@/pages/public/FavoritesPage")) },
      { path: "minha-conta/lista-de-compras", lazy: lazyRoute(() => import("@/pages/public/ShoppingListPage")) },
      { path: "carrinho", lazy: lazyRoute(() => import("@/pages/public/CartPage")) },
      { path: "institucional/:page", lazy: lazyRoute(() => import("@/pages/public/InstitutionalPage")) },
      { path: "checkout", lazy: lazyRoute(() => import("@/pages/public/CheckoutPage")) },
      { path: "compra/sucesso", lazy: lazyRoute(() => import("@/pages/public/PurchaseSuccessPage")) },
      { path: "compra/pendente", lazy: lazyRoute(() => import("@/pages/public/PurchasePendingPage")) },
      { path: "compra/falha", lazy: lazyRoute(() => import("@/pages/public/PurchaseFailurePage")) },
    ],
  },
  {
    path: "/admin/login",
    lazy: lazyRoute(() => import("@/pages/admin/LoginPage")),
  },
  {
    path: "/admin",
    element: (
      <RequireAdminAuth>
        <AdminLayout />
      </RequireAdminAuth>
    ),
    children: [
      { index: true, lazy: lazyRoute(() => import("@/pages/admin/Dashboard")) },
      { path: "receitas", lazy: lazyRoute(() => import("@/pages/admin/RecipeListPage")) },
      { path: "receitas/nova", lazy: lazyRoute(() => import("@/pages/admin/RecipeEditor")) },
      { path: "receitas/:id/editar", lazy: lazyRoute(() => import("@/pages/admin/RecipeEditor")) },
      { path: "categorias", lazy: lazyRoute(() => import("@/pages/admin/CategoriesPage")) },
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
    ],
  },
]);
