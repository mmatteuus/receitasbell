import type { ComponentType } from "react";
import { Navigate, createBrowserRouter } from "react-router-dom";
import PublicLayout from "@/components/layout/PublicLayout";
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

export const router = createBrowserRouter([
  {
    path: "/",
    element: <PublicLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "buscar", lazy: lazyRoute(() => import("@/pages/Search")) },
      { path: "categorias/:slug", lazy: lazyRoute(() => import("@/pages/Category")) },
      { path: "receitas/:slug", lazy: lazyRoute(() => import("@/pages/RecipePage")) },
      { path: "minha-conta", lazy: lazyRoute(() => import("@/pages/AccountHome")) },
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
    path: "/admin",
    lazy: lazyRoute(() => import("@/components/layout/AdminLayout")),
    children: [
      { index: true, lazy: lazyRoute(() => import("@/pages/admin/Dashboard")) },
      { path: "receitas", lazy: lazyRoute(() => import("@/pages/admin/RecipeListPage")) },
      { path: "receitas/nova", lazy: lazyRoute(() => import("@/pages/admin/RecipeEditor")) },
      { path: "receitas/:id/editar", lazy: lazyRoute(() => import("@/pages/admin/RecipeEditor")) },
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
