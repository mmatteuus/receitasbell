import { createBrowserRouter } from "react-router-dom";
import PublicLayout from "@/components/layout/PublicLayout";
import AdminLayout from "@/components/layout/AdminLayout";
import HomePage from "@/pages/Index";
import SearchPage from "@/pages/Search";
import FavoritesPage from "@/pages/Favorites";
import RecipePage from "@/pages/RecipePage";
import CategoryPage from "@/pages/Category";
import InstitutionalPage from "@/pages/Institutional";
import ShoppingListPage from "@/pages/ShoppingListPage";
import CartPage from "@/pages/CartPage";
import Dashboard from "@/pages/admin/Dashboard";
import RecipeListPage from "@/pages/admin/RecipeListPage";
import RecipeEditor from "@/pages/admin/RecipeEditor";
import SettingsPage from "@/pages/admin/SettingsPage";
import CheckoutPage from "@/pages/CheckoutPage";
import SuccessPage from "@/pages/SuccessPage";
import PendingPage from "@/pages/PendingPage";
import FailurePage from "@/pages/FailurePage";
import { AdminPaymentsRoutes } from "./routes_admin_payments";

const ProfilePage = () => <div className="container py-10">Profile Page (Placeholder)</div>;

export const router = createBrowserRouter([
  {
    path: "/",
    element: <PublicLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "buscar", element: <SearchPage /> },
      { path: "categorias/:slug", element: <CategoryPage /> },
      { path: "receitas/:slug", element: <RecipePage /> },
      { path: "minha-conta/perfil", element: <ProfilePage /> },
      { path: "minha-conta/favoritos", element: <FavoritesPage /> },
      { path: "minha-conta/lista-de-compras", element: <ShoppingListPage /> },
      { path: "carrinho", element: <CartPage /> },
      { path: "institucional/:page", element: <InstitutionalPage /> },
      { path: "checkout", element: <CheckoutPage /> },
      { path: "compra/sucesso", element: <SuccessPage /> },
      { path: "compra/pendente", element: <PendingPage /> },
      { path: "compra/falha", element: <FailurePage /> },
    ],
  },
  {
    path: "/admin",
    element: <AdminLayout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: "receitas", element: <RecipeListPage /> },
      { path: "receitas/nova", element: <RecipeEditor /> },
      { path: "receitas/:id/editar", element: <RecipeEditor /> },
      { path: "pagamentos/*", element: <AdminPaymentsRoutes /> },
      { path: "configuracoes", element: <SettingsPage /> },
    ],
  },
]);
