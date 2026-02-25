import { createBrowserRouter } from "react-router-dom";
import PublicLayout from "@/components/layout/PublicLayout";
import AdminLayout from "@/components/layout/AdminLayout";
// import ProfilePage from "@/pages/profile/ui/ProfilePage"; // This page does not exist
import HomePage from "@/pages/Index";
import SearchPage from "@/pages/Search";
import FavoritesPage from "@/pages/Favorites";
import RecipePage from "@/pages/RecipePage";
import CategoryPage from "@/pages/Category";
import InstitutionalPage from "@/pages/Institutional";
import ShoppingListPage from "@/pages/ShoppingListPage";
import Dashboard from "@/pages/admin/Dashboard";
import RecipeListPage from "@/pages/admin/RecipeListPage";
import RecipeEditor from "@/pages/admin/RecipeEditor";

// Placeholder components for routes that were mentioned but not fully provided in context
// In a real scenario, these would be imported from their respective pages
const CheckoutPage = () => <div className="container py-10">Checkout Page (Placeholder)</div>;
const SuccessPage = () => <div className="container py-10">Success Page (Placeholder)</div>;
const ProfilePage = () => <div className="container py-10">Profile Page (Placeholder)</div>;

export const router = createBrowserRouter([
  {
    path: "/",
    element: <PublicLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: "buscar",
        element: <SearchPage />,
      },
      {
        path: "categorias/:slug",
        element: <CategoryPage />,
      },
      {
        path: "receitas/:slug",
        element: <RecipePage />,
      },
      {
        path: "minha-conta/perfil",
        element: <ProfilePage />,
      },
      {
        path: "minha-conta/favoritos",
        element: <FavoritesPage />,
      },
      {
        path: "minha-conta/lista-de-compras",
        element: <ShoppingListPage />,
      },
      {
        path: "institucional/:page",
        element: <InstitutionalPage />,
      },
      {
        path: "checkout",
        element: <CheckoutPage />,
      },
      {
        path: "compra/sucesso",
        element: <SuccessPage />,
      },
    ],
  },
  {
    path: "/admin",
    element: <AdminLayout />,
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: "receitas",
        element: <RecipeListPage />,
      },
      {
        path: "receitas/nova",
        element: <RecipeEditor />,
      },
      {
        path: "receitas/:id/editar",
        element: <RecipeEditor />,
      },
    ],
  },
]);