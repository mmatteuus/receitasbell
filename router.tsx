import { createBrowserRouter } from "react-router-dom";
import PublicLayout from "@/lib/PublicLayout";
import ProfilePage from "@/pages/profile/ui/ProfilePage";
import HomePage from "@/pages/home/ui/HomePage";
import SearchPage from "@/pages/search/ui/SearchPage";
import FavoritesPage from "@/pages/account/ui/FavoritesPage";
import RecipePage from "@/pages/recipe/ui/RecipePage";
import CategoryPage from "@/pages/category/ui/CategoryPage";
import Institutional from "@/pages/Institutional";

// Placeholder components for routes that were mentioned but not fully provided in context
// In a real scenario, these would be imported from their respective pages
const CheckoutPage = () => <div className="container py-10">Checkout Page (Placeholder)</div>;
const SuccessPage = () => <div className="container py-10">Success Page (Placeholder)</div>;

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
        path: "institucional/:page",
        element: <Institutional />,
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
  // Admin routes would go here
]);