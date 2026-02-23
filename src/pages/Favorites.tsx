import { useState } from "react";
import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { getFavorites, getPublishedRecipes, toggleFavorite } from "@/lib/storage";
import RecipeCard from "@/components/RecipeCard";
import { Button } from "@/components/ui/button";

export default function Favorites() {
  const [favIds, setFavIds] = useState(getFavorites);
  const recipes = getPublishedRecipes().filter((r) => favIds.includes(r.id));

  // Force re-render when toggling from recipe cards
  const handleRefresh = () => setFavIds([...getFavorites()]);

  return (
    <div className="container py-10">
      <div className="flex items-center gap-2">
        <Heart className="h-6 w-6 text-primary" />
        <h1 className="font-heading text-3xl font-bold">Meus Favoritos</h1>
      </div>
      {recipes.length > 0 ? (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {recipes.map((r) => <RecipeCard key={r.id} recipe={r} />)}
        </div>
      ) : (
        <div className="mt-12 flex flex-col items-center gap-4 text-center">
          <Heart className="h-16 w-16 text-muted-foreground/30" />
          <p className="text-lg text-muted-foreground">Você ainda não salvou nenhuma receita.</p>
          <Link to="/buscar">
            <Button>Explorar receitas</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
