import { useState, useEffect } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { Heart, Clock, Users, ChevronRight, Printer, Minus, Plus, ChefHat, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getRecipeBySlug, getPublishedRecipes, isFavorite, toggleFavorite, getAverageRating, addRating, getComments, addComment, formatBRL } from "@/lib/storage";
import { getCategoryBySlug } from "@/lib/categories";
import RatingStars from "@/components/RatingStars";
import RecipeCard from "@/components/RecipeCard";
import { PriceBadge } from "@/components/price-badge";
import { PaywallBox } from "@/hooks/paywall-box";
import { useDemoPurchase } from "@/hooks/use-demo-purchase";
import { useCart } from "@/hooks/use-cart";
import { ShareButtons } from "@/components/ShareButtons";
import { BackToTop } from "@/components/BackToTop";
import { ReadingProgress } from "@/components/ReadingProgress";
import { FocusContainer } from "@/components/FocusContainer";

export default function RecipePage() {
  const { slug } = useParams<{ slug: string }>();
  const [params] = useSearchParams();
  const isPreview = params.get("preview") === "1";

  const [recipe, setRecipe] = useState<ReturnType<typeof getRecipeBySlug>>();
  const [fav, setFav] = useState(false);
  const [rating, setRating] = useState({ avg: 0, count: 0 });
  const [comments, setComments] = useState<ReturnType<typeof getComments>>([]);
  const [customServings, setCustomServings] = useState(1);
  const [author, setAuthor] = useState("");
  const [commentText, setCommentText] = useState("");
  const { isUnlocked } = useDemoPurchase();
  const { has: inCart, add: addToCart } = useCart();
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    const foundRecipe = getRecipeBySlug(slug || "");
    setRecipe(foundRecipe);
    if (foundRecipe) {
      setFav(isFavorite(foundRecipe.id));
      setRating(getAverageRating(foundRecipe.id));
      setComments(getComments(foundRecipe.id));
      setCustomServings(foundRecipe.servings || 1);
    }
  }, [slug]);

  const scaleIngredient = (text: string) => {
    const baseServings = recipe?.servings || 1;
    const factor = customServings / baseServings;
    if (factor === 1) return text;
    const regex = /^((?:\d+\s+e\s+)?\d+(?:[.,]\d+)?(?:\s*\/\s*\d+)?)/i;
    const match = text.match(regex);
    if (!match) return text;
    const numberStr = match[0];
    const rest = text.substring(numberStr.length);
    let value = 0;
    numberStr.toLowerCase().split(" e ").forEach((p) => {
      if (p.includes("/")) { const [n, d] = p.split("/"); value += parseFloat(n) / parseFloat(d); }
      else value += parseFloat(p.replace(",", "."));
    });
    if (isNaN(value)) return text;
    return `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(value * factor)}${rest}`;
  };

  if (!recipe || (recipe.status === "draft" && !isPreview)) {
    return (
      <div className="container px-4 py-20 text-center">
        <h1 className="font-heading text-2xl font-bold sm:text-3xl">Receita não encontrada</h1>
        <Link to="/" className="mt-4 inline-block text-primary hover:underline">Voltar</Link>
      </div>
    );
  }

  const cat = getCategoryBySlug(recipe.categorySlug);
  const related = getPublishedRecipes().filter((r) => r.categorySlug === recipe.categorySlug && r.id !== recipe.id).slice(0, 3);

  const unlocked = isUnlocked(recipe.id, recipe.accessTier);
  const showPaywall = !unlocked && recipe.accessTier === "paid";

  // Auto teaser: first 2 items for paid blocked
  const ingredients = showPaywall ? recipe.fullIngredients.slice(0, 2) : recipe.fullIngredients;
  const instructions = showPaywall ? recipe.fullInstructions.slice(0, 2) : recipe.fullInstructions;

  const handleFav = () => { toggleFavorite(recipe.id); setFav(!fav); };
  const handleRate = (v: number) => { addRating(recipe.id, v); setRating(getAverageRating(recipe.id)); };
  const handleComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!author.trim() || !commentText.trim()) return;
    addComment(recipe.id, author.trim(), commentText.trim());
    setComments(getComments(recipe.id));
    setAuthor(""); setCommentText("");
  };

  return (
    <FocusContainer isFocused={isFocused} onClose={() => setIsFocused(false)} className="container max-w-3xl px-4 py-8 sm:py-10 animate-in fade-in duration-500 print:py-0 print:max-w-none">
      {!isFocused && <ReadingProgress />}

      {isPreview && (
        <div className="mb-4 rounded-lg bg-warning/20 px-4 py-2 text-sm font-medium text-warning">
          ⚠️ Pré-visualização — esta receita é um rascunho.
        </div>
      )}

      {/* Breadcrumb */}
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
          {recipe.description && <p className="mt-2 text-base text-muted-foreground sm:mt-3 sm:text-lg print:text-base">{recipe.description}</p>}
        </div>
        <div className="flex flex-wrap gap-2 print:hidden">
          <ShareButtons title={recipe.title} slug={recipe.slug} />
          <Button variant="outline" size="icon" onClick={() => setIsFocused(true)} title="Modo Leitura">
            <ChefHat className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => window.print()} title="Imprimir">
            <Printer className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {recipe.image ? (
        <div className="relative mt-4 overflow-hidden rounded-xl sm:mt-6 print:mt-4">
          <img src={recipe.image} alt={recipe.title} className="w-full max-h-[420px] object-cover transition-transform hover:scale-105 print:object-contain" />
          <div className="absolute right-3 top-3 print:hidden">
            <PriceBadge accessTier={recipe.accessTier} priceBRL={recipe.priceBRL} className="shadow-lg" />
          </div>
        </div>
      ) : (
        <div className="mt-6 flex h-48 items-center justify-center rounded-xl bg-muted text-muted-foreground sm:h-64 print:hidden">
          <ChefHat className="h-16 w-16 opacity-20" />
        </div>
      )}

      {/* Meta */}
      <div className="mt-4 flex flex-wrap gap-3 sm:mt-6 sm:gap-4 print:mt-4">
        {recipe.totalTime > 0 && (
          <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm">
            <Clock className="h-4 w-4 text-primary" />
            <span className="font-medium">{recipe.totalTime} min</span>
          </div>
        )}
        <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2">
          <Users className="h-4 w-4 text-primary" />
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-5 w-5 print:hidden" onClick={() => setCustomServings((s) => Math.max(1, s - 1))}>
              <Minus className="h-3 w-3" />
            </Button>
            <span className="text-sm font-medium">{customServings} porções</span>
            <Button variant="ghost" size="icon" className="h-5 w-5 print:hidden" onClick={() => setCustomServings((s) => s + 1)}>
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>
        {rating.count > 0 && (
          <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm print:hidden">
            ⭐ {rating.avg.toFixed(1)} ({rating.count})
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-4 flex flex-wrap items-center gap-3 sm:mt-6 print:hidden">
        <Button variant={fav ? "default" : "outline"} onClick={handleFav} className="gap-2">
          <Heart className={`h-4 w-4 ${fav ? "fill-current" : ""}`} />
          {fav ? "Salvo" : "Favoritar"}
        </Button>
        {showPaywall && (
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => addToCart(recipe.id)}
            disabled={inCart(recipe.id)}
          >
            <ShoppingCart className="h-4 w-4" />
            {inCart(recipe.id) ? "No carrinho ✓" : "Adicionar ao carrinho"}
          </Button>
        )}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Sua nota:</span>
          <RatingStars onChange={handleRate} />
        </div>
      </div>

      {/* Tags */}
      {recipe.tags?.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2 print:hidden">
          {recipe.tags.map((t) => <Badge key={t} variant="secondary">{t}</Badge>)}
        </div>
      )}

      <Separator className="my-6 sm:my-8 print:my-4" />

      {/* Ingredients */}
      <h2 className="font-heading text-xl font-bold sm:text-2xl print:text-xl">
        Ingredientes
        <span className="ml-2 text-sm font-normal text-muted-foreground">
          (para {customServings} {customServings === 1 ? "pessoa" : "pessoas"})
        </span>
      </h2>
      <ul className="mt-3 space-y-2 sm:mt-4 print:space-y-1">
        {ingredients.map((ing, i) => (
          <li key={i} className="flex items-start gap-2 text-sm print:text-base">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary print:bg-black" />
            {scaleIngredient(ing)}
          </li>
        ))}
        {showPaywall && (
          <li className="flex items-center justify-center rounded-lg border border-dashed bg-muted/30 p-3 text-sm italic text-muted-foreground">
            … e mais ingredientes (disponível após a compra)
          </li>
        )}
      </ul>

      <Separator className="my-6 sm:my-8 print:my-4" />

      {/* Steps */}
      <h2 className="font-heading text-xl font-bold sm:text-2xl print:text-xl">Modo de Preparo</h2>
      <ol className="mt-3 space-y-3 sm:mt-4 sm:space-y-4 print:space-y-2">
        {instructions.map((step, i) => (
          <li key={i} className="flex gap-3 rounded-lg border bg-card p-3 sm:gap-4 sm:p-4 print:border-0 print:bg-transparent print:p-0">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground sm:h-7 sm:w-7 sm:text-sm">
              {i + 1}
            </span>
            <p className="text-sm leading-relaxed sm:text-base print:text-base">{step}</p>
          </li>
        ))}
        {showPaywall && (
          <div className="rounded-lg border border-dashed bg-muted/30 p-3 text-center text-sm italic text-muted-foreground">
            … passos detalhados (disponível após a compra)
          </div>
        )}
      </ol>

      {showPaywall && (
        <div className="mt-8 print:hidden">
          <PaywallBox priceBRL={recipe.priceBRL || 0} recipeId={recipe.id} recipeSlug={recipe.slug} />
        </div>
      )}

      <Separator className="my-6 sm:my-8 print:hidden" />

      {/* Comments */}
      <h2 className="font-heading text-xl font-bold sm:text-2xl print:hidden">Comentários ({comments.length})</h2>
      <form onSubmit={handleComment} className="mt-4 space-y-3 rounded-lg border bg-card p-4 print:hidden">
        <Input placeholder="Seu nome" value={author} onChange={(e) => setAuthor(e.target.value)} />
        <Textarea placeholder="Deixe seu comentário..." value={commentText} onChange={(e) => setCommentText(e.target.value)} rows={3} />
        <Button type="submit" size="sm">Comentar</Button>
      </form>
      {comments.length > 0 && (
        <div className="mt-4 space-y-3">
          {comments.map((c) => (
            <div key={c.id} className="rounded-lg border bg-card p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">{c.author}</span>
                <span className="text-xs text-muted-foreground">{new Date(c.createdAt).toLocaleDateString("pt-BR")}</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{c.text}</p>
            </div>
          ))}
        </div>
      )}

      {/* Related */}
      <div className="print:hidden">
        {related.length > 0 && !showPaywall && (
          <>
            <Separator className="my-8" />
            <h2 className="font-heading text-xl font-bold sm:text-2xl">Quem gostou também viu</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {related.map((r) => <RecipeCard key={r.id} recipe={r} />)}
            </div>
          </>
        )}
      </div>

      {!isFocused && <BackToTop />}
    </FocusContainer>
  );
}
