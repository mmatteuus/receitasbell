import { Link } from "react-router-dom";
import { Clock, Users, Lock, Unlock } from "lucide-react";
import { Recipe } from "@/entities/recipe/model/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Rating } from "@/components/ui/rating";

interface RecipeCardProps {
  recipe: Recipe;
}

export function RecipeCard({ recipe }: RecipeCardProps) {
  const isPaid = recipe.accessTier === "paid";

  return (
    <Link to={`/receitas/${recipe.slug}`}>
      <Card className="h-full overflow-hidden hover:shadow-lg transition-shadow duration-300 group cursor-pointer border-muted flex flex-col">
        <div className="relative aspect-video overflow-hidden bg-muted">
          {recipe.image ? (
            <img
              src={recipe.image}
              alt={recipe.title}
              className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex items-center justify-center w-full h-full text-muted-foreground bg-secondary/20 font-sans">
              Sem imagem
            </div>
          )}
          <div className="absolute top-2 right-2">
            {isPaid ? (
              <Badge variant="secondary" className="gap-1 bg-black/70 text-white hover:bg-black/80 backdrop-blur-sm font-sans">
                <Lock className="h-3 w-3" /> Premium
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1 bg-green-500/90 text-white hover:bg-green-600/90 backdrop-blur-sm font-sans">
                <Unlock className="h-3 w-3" /> Grátis
              </Badge>
            )}
          </div>
          <div className="absolute bottom-2 left-2">
             <Badge variant="outline" className="bg-background/80 backdrop-blur-sm border-none text-xs capitalize font-sans">
                {recipe.categorySlug}
             </Badge>
          </div>
        </div>
        
        <CardHeader className="p-4 pb-2">
          <h3 className="font-serif font-bold text-xl leading-tight group-hover:text-primary transition-colors line-clamp-2">
            {recipe.title}
          </h3>
          <div className="pt-1">
            <Rating rating={recipe.rating || 0} count={recipe.reviewsCount} />
          </div>
        </CardHeader>
        
        <CardContent className="p-4 pt-0 pb-4 flex-1">
          <p className="text-muted-foreground text-sm line-clamp-2 font-sans">
            {recipe.description}
          </p>
        </CardContent>
        
        <CardFooter className="p-4 pt-0 text-xs text-muted-foreground flex items-center gap-4 font-sans border-t bg-muted/10 mt-auto py-3">
          <div className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            <span>{recipe.totalTime} min</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            <span>{recipe.servings} porções</span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}