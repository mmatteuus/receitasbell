import { seedRecipes } from "@/lib/seed-data";
import RecipeCard from "@/components/RecipeCard";

interface RelatedRecipesProps {
  currentRecipeId: string;
  categorySlug: string;
}

export function RelatedRecipes({ currentRecipeId, categorySlug }: RelatedRecipesProps) {
  const related = seedRecipes
    .filter((r) => r.categorySlug === categorySlug && r.id !== currentRecipeId)
    .slice(0, 3);

  if (related.length === 0) return null;

  return (
    <div className="mt-16 border-t pt-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <h2 className="mb-6 font-heading text-2xl font-bold">Receitas Relacionadas</h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {related.map((recipe) => (
          <RecipeCard key={recipe.id} recipe={recipe} />
        ))}
      </div>
    </div>
  );
}