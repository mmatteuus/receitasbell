import { Link } from "react-router-dom";
import { Clock, Users } from "lucide-react";
import { Recipe } from "@/types/recipe";
import { getCategoryBySlug } from "@/lib/categories";
import { getAverageRating } from "@/lib/storage";
import { Badge } from "@/components/ui/badge";

interface Props {
  recipe: Recipe;
}

export default function RecipeCard({ recipe }: Props) {
  const cat = getCategoryBySlug(recipe.categorySlug);
  const { avg, count } = getAverageRating(recipe.id);

  return (
    <Link
      to={`/receitas/${recipe.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border bg-card shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {recipe.image ? (
          <img
            src={recipe.image}
            alt={recipe.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl">
            {cat?.emoji || "🍽️"}
          </div>
        )}
        {cat && (
          <Badge className="absolute left-3 top-3 bg-card/90 text-foreground backdrop-blur">
            {cat.emoji} {cat.name}
          </Badge>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-heading text-lg font-semibold leading-tight group-hover:text-primary">
          {recipe.title}
        </h3>
        {recipe.description && (
          <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">
            {recipe.description}
          </p>
        )}
        <div className="mt-auto flex items-center gap-3 pt-3 text-xs text-muted-foreground">
          {recipe.totalTime > 0 && (
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {recipe.totalTime} min
            </span>
          )}
          {recipe.servings > 0 && (
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {recipe.servings} porções
            </span>
          )}
          {count > 0 && (
            <span className="ml-auto flex items-center gap-1">
              ⭐ {avg.toFixed(1)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
