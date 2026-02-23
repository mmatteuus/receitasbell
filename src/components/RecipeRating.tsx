import { useRecipeRating } from "@/hooks/use-recipe-rating";
import RatingStars from "@/components/RatingStars";

interface Props {
  recipeId: string;
}

export function RecipeRating({ recipeId }: Props) {
  const { userRating, averageRating, totalVotes, rate } = useRecipeRating(recipeId);

  return (
    <div className="my-8 rounded-xl border bg-card p-6 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-700">
      <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
        <div className="text-center sm:text-left">
          <h3 className="font-heading text-lg font-semibold">O que achou da receita?</h3>
          <p className="text-sm text-muted-foreground">
            {userRating > 0 ? "Obrigado por avaliar!" : "Dê sua nota e ajude outros usuários."}
          </p>
        </div>
        
        <div className="flex flex-col items-center gap-2 sm:items-end">
          <RatingStars value={userRating} onChange={rate} size={32} />
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{averageRating.toFixed(1)}</span>
            <span>({totalVotes} avaliações)</span>
          </div>
        </div>
      </div>
    </div>
  );
}