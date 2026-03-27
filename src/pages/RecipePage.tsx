import { useEffect, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { Heart, Clock, ChevronRight, Printer, ChefHat, ShoppingCart, FileText, BarChart, Flame, PlayCircle, Plus, Minus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { listComments, submitRating } from "@/lib/api/interactions";
import { PageHead } from "@/components/PageHead";
import RecipeIngredients from "@/components/recipe/RecipeIngredients";
import { scaleIngredient } from "@/lib/utils/scaleIngredient";
import RecipeComments from "@/components/recipe/RecipeComments";
import type { Comment } from "@/types/recipe";
import RatingStars from "@/components/RatingStars";
import RecipeCard from "@/components/RecipeCard";
import { PriceBadge } from "@/components/price-badge";
import { PaywallBox } from "@/components/recipe/PaywallBox";
import { useCart } from "@/hooks/use-cart";
import { ShareButtons } from "@/components/ShareButtons";
import { BackToTop } from "@/components/BackToTop";
import { ReadingProgress } from "@/components/ReadingProgress";
import { FocusContainer } from "@/components/FocusContainer";
import { useAppContext } from "@/contexts/app-context";
import { useFavorites } from "@/hooks/use-favorites";
import { ApiClientError } from "@/lib/api/client";
import { toast } from "sonner";
import { getRecipeImage, getRecipePresentation } from "@/lib/recipes/presentation";
import SmartImage from "@/components/SmartImage";
import { buildCartItemFromRecipe } from "@/lib/utils/recipeAccess";
import { usePublicRecipes, useRecipeBySlug } from "@/features/recipes/use-recipes";
import { exportRecipeToPDF } from "@/lib/recipes/export";
import { RECENT_RECIPES_KEY } from "@/lib/constants";

type RatingState = {
  avg: number;
  count: number;
  userValue: number | null;
};

export default function RecipePage() {
  const { slug } = useParams<{ slug: string }>();
  const [params] = useSearchParams();
  const isPreview = params.get("preview") === "1";

  const { data: recipe, isLoading: loading } = useRecipeBySlug(slug);
  const [rating, setRating] = useState<RatingState>({ avg: 0, count: 0, userValue: null });
  const [comments, setComments] = useState<Comment[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const [customServings, setCustomServings] = useState<number | null>(null);
  const { has: inCart, add: addToCart } = useCart();
  const { categories, requireIdentity } = useAppContext();
  const { isFavorite, toggleFavorite } = useFavorites();

  // Load related recipes from cache
  const { data: categoryRecipes = [] } = usePublicRecipes(
    recipe?.categorySlug ? { categorySlug: recipe.categorySlug } : {},
  );
  const related = recipe
    ? categoryRecipes.filter((item) => item.id !== recipe.id).slice(0, 3)
    : [];

  // Sync rating state when recipe loads
  useEffect(() => {
    if (!recipe) return;
    setRating({
      avg: recipe.ratingAvg || 0,
      count: recipe.ratingCount || 0,
      userValue: null,
    });
  }, [recipe]);

  // Load comments
  useEffect(() => {
    if (!recipe) return;
    listComments(recipe.id)
      .then((result) => setComments(Array.isArray(result) ? result : []))
      .catch(() => setComments([]));
  }, [recipe]);

  // Save to recent recipes history
  useEffect(() => {
    if (!recipe) return;
    try {
      const stored = JSON.parse(localStorage.getItem(RECENT_RECIPES_KEY) || "[]");
      const next = [recipe.id, ...(Array.isArray(stored) ? stored : []).filter((id) => id !== recipe.id)].slice(0, 8);
      localStorage.setItem(RECENT_RECIPES_KEY, JSON.stringify(next));
    } catch {
      // ignore storage errors
    }
  }, [recipe]);

  if (loading) {
    return (
      <div className="container max-w-3xl px-4 py-8 sm:py-10">
        <Skeleton className="mb-4 h-4 w-48" />
        <Skeleton className="h-8 w-3/4 sm:h-10" />
        <Skeleton className="mt-3 h-5 w-2/3" />
        <Skeleton className="mt-6 h-[320px] w-full rounded-xl sm:h-[420px]" />
        <div className="mt-6 flex gap-3">
          <Skeleton className="h-10 w-28 rounded-lg" />
          <Skeleton className="h-10 w-28 rounded-lg" />
        </div>
        <Separator className="my-8" />
        <Skeleton className="h-7 w-40" />
        <div className="mt-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-5 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!recipe || (recipe.status === "draft" && !isPreview)) {
    return (
      <div className="container px-4 py-20 text-center">
        <h1 className="font-heading text-2xl font-bold sm:text-3xl">Receita não encontrada</h1>
        <Link to="/" className="mt-4 inline-block text-primary hover:underline">Voltar</Link>
      </div>
    );
  }

  const cat = categories.find((category) => category.slug === recipe.categorySlug);
  const favorite = isFavorite(recipe.id);
  const imageUrl = getRecipeImage(recipe);
  const presentation = getRecipePresentation(recipe);
  const unlocked = recipe.accessTier === "free" || Boolean(recipe.hasAccess);
  const showPaywall = !unlocked && recipe.accessTier === "paid";
  const ingredients = recipe.fullIngredients;
  const instructions = recipe.fullInstructions;

  async function handleFavorite() {
    await toggleFavorite(recipe.id);
  }

  const baseServings = recipe.servings || 1;
  const currentServings = customServings ?? baseServings;

  async function handleRate(value: number) {
    const email = await requireIdentity("Digite seu e-mail para avaliar esta receita.");
    if (!email) return;

    try {
      const summary = await submitRating({ recipeId: recipe.id, value });
      setRating(summary);
      toast.success("Avaliação registrada");
    } catch (error) {
      if (error instanceof ApiClientError) {
        toast.error(error.message);
        return;
      }
      console.error("Failed to save rating", error);
      toast.error("Não foi possível salvar sua avaliação.");
    }
  }

  function handleExportPdf() {
    const opened = exportRecipeToPDF({
      recipe,
      ingredients: ingredients.map((ingredient) => scaleIngredient(ingredient, baseServings, currentServings)),
      instructions,
      isTeaserOnly: showPaywall,
    });

    if (!opened) {
      toast.error("Não foi possível abrir a janela de exportação. Verifique o bloqueador de pop-up.");
    }
  }

  return (
    <FocusContainer isFocused={isFocused} onClose={() => setIsFocused(false)} className="container max-w-3xl px-4 py-8 sm:py-10 animate-in fade-in duration-500 print:py-0 print:max-w-none">
      <PageHead
        title={recipe.seoTitle || recipe.title}
        description={recipe.seoDescription || recipe.description}
        imageUrl={imageUrl}
        canonicalPath={`/receitas/${recipe.slug}`}
      />
      {!isFocused && <ReadingProgress />}

      {isPreview && (
        <div className="mb-4 rounded-lg bg-warning/20 px-4 py-2 text-sm font-medium text-warning">
          Pré-visualização: esta receita é um rascunho.
        </div>
      )}

      <nav className="mb-4 flex flex-wrap items-center gap-1 text-sm text-muted-foreground print:hidden">
        <Link to="/" className="hover:text-primary">Home</Link>
        <ChevronRight className="h-3 w-3" />
        {cat && <Link to={`/categorias/${cat.slug}`} className="hover:text-primary">{cat.name}</Link>}
        <ChevronRight className="h-3 w-3" />
        <span className="truncate text-foreground">{recipe.title}</span>
      </nav>

      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold sm:text-3xl md:text-4xl print:text-2xl">{recipe.title}</h1>
          {(recipe.description || presentation.cardSubtitle) && (
            <p className="mt-2 text-base text-muted-foreground sm:mt-3 sm:text-lg print:text-base">
              {recipe.description || presentation.cardSubtitle}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2 print:hidden">
          <ShareButtons title={recipe.title} slug={recipe.slug} />
          <Button variant="outline" size="icon" onClick={() => setIsFocused(true)} title="Modo Leitura">
            <ChefHat className="h-4 w-4" />
          </Button>
          <Button variant="outline" className="gap-2" onClick={handleExportPdf} title="Exportar PDF">
            <FileText className="h-4 w-4" />
            PDF
          </Button>
          {recipe.videoUrl && (
            <Button asChild variant="outline" className="gap-2" title="Assistir Vídeo">
               <a href={recipe.videoUrl} target="_blank" rel="noopener noreferrer">
                 <PlayCircle className="h-4 w-4" /> Vídeo
               </a>
            </Button>
          )}
          <Button variant="outline" size="icon" onClick={() => window.print()} title="Imprimir">
            <Printer className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {imageUrl ? (
        <div className="relative mt-4 overflow-hidden rounded-xl sm:mt-6 print:mt-4">
          <SmartImage
            src={imageUrl}
            alt={recipe.title}
            className="w-full max-h-[420px] object-cover transition-transform hover:scale-105 print:object-contain"
          />
          <div className="absolute right-3 top-3 print:hidden">
            <PriceBadge accessTier={recipe.accessTier} priceBRL={recipe.priceBRL} className="shadow-lg" />
          </div>
        </div>
      ) : (
        <div className="mt-6 flex h-48 items-center justify-center rounded-xl bg-muted text-muted-foreground sm:h-64 print:hidden">
          <ChefHat className="h-16 w-16 opacity-20" />
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2 sm:mt-6 sm:gap-3 print:mt-4">
        {recipe.totalTime > 0 && (
          <div className="flex items-center gap-1.5 rounded-lg border bg-card px-2.5 py-1.5 text-sm">
            <Clock className="h-4 w-4 text-primary" />
            <span className="font-medium text-muted-foreground">{recipe.totalTime}m</span>
          </div>
        )}
        {recipe.difficulty && (
          <div className="flex items-center gap-1.5 rounded-lg border bg-card px-2.5 py-1.5 text-sm">
            <BarChart className="h-4 w-4 text-primary" />
            <span className="font-medium text-muted-foreground">{recipe.difficulty}</span>
          </div>
        )}
        {recipe.calories && (
          <div className="flex items-center gap-1.5 rounded-lg border bg-card px-2.5 py-1.5 text-sm text-center">
            <Flame className="h-4 w-4 text-primary" />
            <span className="font-medium text-muted-foreground">{recipe.calories} kcal</span>
          </div>
        )}
        <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm shadow-sm transition-all hover:border-primary/30">
          <Users className="h-4 w-4 text-primary" />
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0 print:hidden"
              onClick={() => setCustomServings(Math.max(1, currentServings - 1))}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className="min-w-[4rem] text-center font-bold">
              {currentServings} {currentServings === 1 ? "porção" : "porções"}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0 print:hidden"
              onClick={() => setCustomServings(currentServings + 1)}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {rating.count > 0 && (
          <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm">
            ⭐ {rating.avg.toFixed(1)} ({rating.count})
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 sm:mt-6 print:hidden">
        <Button variant={favorite ? "default" : "outline"} onClick={() => void handleFavorite()} className="gap-2">
          <Heart className={`h-4 w-4 ${favorite ? "fill-current" : ""}`} />
          {favorite ? "Salvo" : "Favoritar"}
        </Button>
        {showPaywall && (
          <Button
            variant="default"
            className="w-full gap-2 bg-gradient-to-r from-primary to-orange-600 shadow-md transition-all hover:scale-[1.02] sm:w-auto"
            onClick={() => addToCart(buildCartItemFromRecipe(recipe))}
            disabled={inCart(recipe.id)}
          >
            <ShoppingCart className="h-4 w-4" />
            {inCart(recipe.id) ? "No carrinho ✓" : "Adicionar ao carrinho"}
          </Button>
        )}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Sua nota:</span>
          <RatingStars value={rating.userValue || 0} onChange={(value) => void handleRate(value)} />
        </div>
      </div>

      {recipe.tags?.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2 print:hidden">
          {recipe.tags.map((tag) => <Badge key={tag} variant="secondary">{tag}</Badge>)}
        </div>
      )}

      <RecipeIngredients
        recipeId={recipe.id}
        recipeTitle={recipe.title}
        ingredients={ingredients}
        servings={baseServings}
        customServings={currentServings}
        showPaywall={showPaywall}
      />

      <Separator className="my-6 sm:my-8 print:my-4" />

      <h2 className="font-heading text-xl font-bold sm:text-2xl print:text-xl">Modo de Preparo</h2>
      <ol className="mt-3 space-y-3 sm:mt-4 sm:space-y-4 print:space-y-2">
        {instructions.map((step, index) => (
          <li key={index} className="flex gap-3 rounded-lg border bg-card p-3 sm:gap-4 sm:p-4 print:border-0 print:bg-transparent print:p-0">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground sm:h-7 sm:w-7 sm:text-sm">
              {index + 1}
            </span>
            <p className="text-sm leading-relaxed sm:text-base print:text-base">{step}</p>
          </li>
        ))}
        {showPaywall && (
          <div className="rounded-lg border border-dashed bg-muted/30 p-3 text-center text-sm italic text-muted-foreground">
            ... passos detalhados (disponível após a compra)
          </div>
        )}
      </ol>

      {showPaywall && (
        <div className="mt-8 print:hidden">
          <PaywallBox
            priceBRL={recipe.priceBRL || 0}
            recipeId={recipe.id}
            recipeSlug={recipe.slug}
            recipeTitle={recipe.title}
            imageUrl={imageUrl}
          />
        </div>
      )}

      <Separator className="my-6 sm:my-8 print:hidden" />

      <RecipeComments
        recipeId={recipe.id}
        comments={comments}
        onCommentAdded={(comment) => setComments((current) => [comment, ...current])}
      />

      <div className="print:hidden">
        {related.length > 0 && !showPaywall && (
          <>
            <Separator className="my-8" />
            <h2 className="font-heading text-xl font-bold sm:text-2xl">Quem gostou também viu</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {related.map((item) => <RecipeCard key={item.id} recipe={item} />)}
            </div>
          </>
        )}
      </div>

      {!isFocused && <BackToTop />}
    </FocusContainer>
  );
}
