import { Link } from "react-router-dom";
import { Clock, Users, Heart } from "lucide-react";
import { Recipe } from "@/types/recipe";
import { PriceBadge } from "@/components/price-badge";
import { useFavorites } from "@/hooks/use-favorites";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface RecipeCardProps {
  recipe: Recipe;
}

export default function RecipeCard({ recipe }: RecipeCardProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const isFav = isFavorite(recipe.id);

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border bg-card shadow-sm transition-all hover:shadow-md">
      <Link to={`/receitas/${recipe.slug}`} className="relative aspect-[4/3] overflow-hidden">
        <img
          src={recipe.image || "/placeholder-food.jpg"}
          alt={recipe.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute left-2 top-2">
           <PriceBadge accessTier={recipe.accessTier} priceCents={recipe.priceCents} />
        </div>
        <div className="absolute right-2 top-2">
          <Button
            variant="secondary"
            size="icon"
            className="h-8 w-8 rounded-full bg-white/90 shadow-sm hover:bg-white hover:text-red-500 dark:bg-black/60 dark:hover:bg-black/80"
            onClick={(e) => {
              e.preventDefault();
              toggleFavorite(recipe.id);
            }}
          >
            <Heart className={`h-4 w-4 transition-colors ${isFav ? "fill-red-500 text-red-500" : "text-muted-foreground"}`} />
            <span className="sr-only">Favoritar</span>
          </Button>
        </div>
      </Link>
      
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2">
          <Badge variant="outline" className="text-xs font-normal capitalize">
            {recipe.categorySlug}
          </Badge>
        </div>

        <Link to={`/receitas/${recipe.slug}`} className="group-hover:underline">
          <h3 className="line-clamp-1 font-heading text-lg font-semibold">{recipe.title}</h3>
        </Link>
        
        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
          {recipe.description}
        </p>

        <div className="mt-auto flex items-center gap-4 pt-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            <span>{recipe.totalTime} min</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            <span>{recipe.servings} porções</span>
          </div>
        </div>
      </div>
    </div>
  );
}