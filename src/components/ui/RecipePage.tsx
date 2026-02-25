import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Recipe } from "@/types/recipe";
import { getRecipeBySlug, getPublishedRecipes } from "@/lib/storage";
import RecipeCard from "@/components/RecipeCard";
import { Button } from "@/components/ui/button";
import { Rating } from "@/components/ui/rating";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, ChefHat, Lock, ArrowLeft, Heart, Share2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { SocialShare } from "@/components/ui/social-share";

export default function RecipePage() {
  const { slug } = useParams<{ slug: string }>();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [relatedRecipes, setRelatedRecipes] = useState<Recipe[]>([]);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    const data = getRecipeBySlug(slug);
    setRecipe(data || null);
    
    if (data) {
      const purchased = JSON.parse(localStorage.getItem("purchasedRecipes") || "[]");
      const isPurchased = purchased.includes(data.id);
      setHasAccess(data.accessTier === "free" || isPurchased);

      const favorites = JSON.parse(localStorage.getItem("receitas_bell_favorites") || "[]");
      setIsFavorite(favorites.includes(data.id));

      const allRecipes = getPublishedRecipes();
      const related = allRecipes
        .filter(r => r.categorySlug === data.categorySlug && r.id !== data.id)
        .slice(0, 3);
      setRelatedRecipes(related);
    }
    setLoading(false);
  }, [slug]);

  const toggleFavorite = () => {
    if (!recipe) return;
    const favorites = JSON.parse(localStorage.getItem("receitas_bell_favorites") || "[]");
    let newFavorites;
    if (isFavorite) {
      newFavorites = favorites.filter((id: string) => id !== recipe.id);
      toast.success("Receita removida dos favoritos");
    } else {
      newFavorites = [...favorites, recipe.id];
      toast.success("Receita salva nos favoritos");
    }
    localStorage.setItem("receitas_bell_favorites", JSON.stringify(newFavorites));
    setIsFavorite(!isFavorite);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copiado para a área de transferência!");
  };

  if (loading) {
    return (
      <div className="container max-w-4xl py-10 space-y-8">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-64 w-full rounded-xl" />
        <div className="space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="container py-20 text-center">
        <h2 className="font-heading text-2xl font-bold mb-4">Receita não encontrada</h2>
        <p className="text-muted-foreground mb-8">A receita que você procura não existe ou foi removida.</p>
        <Link to="/"><Button variant="outline">Voltar para Home</Button></Link>
      </div>
    );
  }

  const displayIngredients = hasAccess ? recipe.ingredients : (recipe.teaserIngredients || []);
  const displayInstructions = hasAccess ? recipe.instructions : (recipe.teaserInstructions || []);

  return (
    <div className="container max-w-4xl py-10">
      <div className="flex items-center justify-between mb-6">
        <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Link>
        <div className="flex gap-2 items-center">
          {recipe && <SocialShare url={window.location.href} title={recipe.title} />}
          <div className="h-6 w-px bg-border mx-1" />
          <Button variant="ghost" size="icon" onClick={handleShare} className="text-muted-foreground hover:text-primary" title="Copiar Link">
            <Share2 className="h-6 w-6" />
          </Button>
          <Button variant="ghost" size="icon" onClick={toggleFavorite} className={isFavorite ? "text-red-500 hover:text-red-600 hover:bg-red-50" : "text-muted-foreground"} title={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}>
            <Heart className={`h-6 w-6 ${isFavorite ? "fill-current" : ""}`} />
          </Button>
        </div>
      </div>

      <article className="space-y-8">
        <header className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="capitalize">{recipe.categorySlug}</Badge>
            {recipe.accessTier === "paid" && (
              <Badge variant={hasAccess ? "outline" : "destructive"} className="gap-1">
                {hasAccess ? "Desbloqueado" : <><Lock className="h-3 w-3" /> Premium</>}
              </Badge>
            )}
          </div>
          <h1 className="font-heading text-4xl font-bold tracking-tight lg:text-5xl text-foreground">{recipe.title}</h1>
          <p className="text-xl text-muted-foreground leading-relaxed">{recipe.description}</p>
          <div className="flex items-center gap-4">
            <Rating rating={recipe.rating || 0} count={recipe.reviewsCount} className="scale-110 origin-left" />
          </div>
          <div className="flex flex-wrap gap-6 text-sm font-medium text-muted-foreground border-y py-4">
            <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /><span>Preparo: {recipe.prepTime} min</span></div>
            <div className="flex items-center gap-2"><ChefHat className="h-4 w-4 text-primary" /><span>Cozimento: {recipe.cookTime} min</span></div>
            <div className="flex items-center gap-2"><Users className="h-4 w-4 text-primary" /><span>Porções: {recipe.servings}</span></div>
          </div>
        </header>

        {recipe.image && (
          <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-muted shadow-sm">
            <img src={recipe.image} alt={recipe.title} className="object-cover w-full h-full transition-transform hover:scale-105 duration-700" />
          </div>
        )}

        <div className="grid md:grid-cols-[1fr_1.5fr] gap-12">
          <section className="space-y-4">
            <h3 className="font-heading text-2xl font-bold">Ingredientes</h3>
            <ul className="space-y-2">
              {displayIngredients.map((ing, i) => (
                <li key={i} className="flex items-start gap-3 rounded-lg border p-3 text-sm">
                  <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <span>{ing}</span>
                </li>
              ))}
            </ul>
            {!hasAccess && recipe.accessTier === "paid" && (
              <div className="p-4 bg-muted/30 rounded-lg border border-dashed text-center text-sm text-muted-foreground italic">
                + Ingredientes secretos exclusivos da versão completa...
              </div>
            )}
          </section>

          <section className="space-y-6">
            <h3 className="font-heading text-2xl font-bold">Modo de Preparo</h3>
            <ol className="space-y-8">
              {displayInstructions.map((step, index) => (
                <li key={index} className="flex gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-primary/20 bg-primary/5 text-primary font-bold text-sm">{index + 1}</span>
                  <p className="text-muted-foreground mt-1 leading-relaxed">{step}</p>
                </li>
              ))}
            </ol>
            {!hasAccess && recipe.accessTier === "paid" && (
              <div className="mt-10 rounded-xl border border-orange-200 bg-orange-50 p-8 text-center dark:bg-orange-950/20 dark:border-orange-900/50">
                <div className="flex flex-col items-center justify-center space-y-4">
                  <div className="p-3 bg-orange-100 dark:bg-orange-900/40 rounded-full"><Lock className="h-8 w-8 text-orange-600 dark:text-orange-400" /></div>
                  <div className="space-y-2">
                    <h3 className="font-heading text-xl font-bold text-orange-900 dark:text-orange-100">Receita Exclusiva</h3>
                    <p className="text-orange-800/80 dark:text-orange-200/70 max-w-md mx-auto">
                      Desbloqueie o acesso completo a esta receita por apenas
                      <span className="font-bold"> {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: recipe.currency || 'BRL' }).format((recipe.priceCents || 0) / 100)}</span>.
                    </p>
                  </div>
                  <Link to={`/checkout?recipeId=${recipe.id}&price=${recipe.priceCents}&recipeTitle=${encodeURIComponent(recipe.title)}`}>
                    <Button size="lg" className="bg-orange-600 hover:bg-orange-700 text-white shadow-md w-full sm:w-auto">Desbloquear Agora</Button>
                  </Link>
                  <p className="text-xs text-orange-800/60 dark:text-orange-300/50">Pagamento único • Acesso vitalício</p>
                </div>
              </div>
            )}
          </section>
        </div>
      </article>

      {relatedRecipes.length > 0 && (
        <section className="mt-16 border-t pt-10 space-y-6">
          <h2 className="font-heading text-3xl font-bold">Receitas Relacionadas</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {relatedRecipes.map((related) => (
              <RecipeCard key={related.id} recipe={related} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}