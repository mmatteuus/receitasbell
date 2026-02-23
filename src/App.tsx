import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import PublicLayout from "@/components/layout/PublicLayout";
import AdminLayout from "@/components/layout/AdminLayout";
import Index from "./pages/Index";
import SearchPage from "./pages/Search";
import Category from "./pages/Category";
import RecipePage from "./pages/RecipePage";
import Favorites from "./pages/Favorites";
import Institutional from "./pages/Institutional";
import Dashboard from "./pages/admin/Dashboard";
import RecipeListPage from "./pages/admin/RecipeListPage";
import RecipeEditor from "./pages/admin/RecipeEditor";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Index />} />
            <Route path="/buscar" element={<SearchPage />} />
            <Route path="/categorias/:slug" element={<Category />} />
            <Route path="/receitas/:slug" element={<RecipePage />} />
            <Route path="/minha-conta/favoritos" element={<Favorites />} />
            <Route path="/institucional/:page" element={<Institutional />} />
          </Route>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="receitas" element={<RecipeListPage />} />
            <Route path="receitas/nova" element={<RecipeEditor />} />
            <Route path="receitas/:id/editar" element={<RecipeEditor />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
