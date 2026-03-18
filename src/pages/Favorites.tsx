import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { listPublicRecipes } from "@/lib/repos/recipeRepo";
import { useAppContext } from "@/contexts/app-context";
import { useFavorites } from "@/hooks/use-favorites";
import RecipeCard from "@/components/RecipeCard";
import { Button } from "@/components/ui/button";
import type { Recipe } from "@/types/recipe";

export default function Favorites() {
  const { favorites } = useFavorites();
  const { requireIdentity } = useAppContext();
  const [recipes, setRecipes] = useState<Recipe[]>([]);

  useEffect(() => {
    void requireIdentity("Digite seu e-mail para acessar seus favoritos.");
  }, [requireIdentity]);

  useEffect(() => {
    async function loadFavoriteRecipes() {
      if (!favorites.length) {
        setRecipes([]);
        return;
      }

      try {
        setRecipes(await listPublicRecipes({ ids: favorites }));
      } catch (error) {
        console.error("Failed to load favorites", error);
      }
    }

    void loadFavoriteRecipes();
  }, [favorites]);

  return (
    <div className="container py-10">
      <div className="flex items-center gap-3 mb-8">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/20">
          <Heart className="h-5 w-5 fill-current" />
        </div>
        <h1 className="font-heading text-3xl font-bold">Meus Favoritos</h1>
      </div>

      {recipes.length > 0 ? (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {recipes.map((r) => <RecipeCard key={r.id} recipe={r} />)}
        </div>
      ) : (
        <div className="mt-12 flex flex-col items-center gap-4 text-center py-12 border-2 border-dashed rounded-xl">
          <div className="p-4 bg-muted rounded-full">
            <Heart className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold">Sua lista está vazia</h2>
          <p className="text-muted-foreground max-w-sm">Você ainda não salvou nenhuma receita. Explore nosso catálogo e salve seus pratos favoritos!</p>
          <Link to="/buscar">
            <Button>Explorar receitas</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
