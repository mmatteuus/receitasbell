import { useState, useEffect } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { Heart, Clock, Users, ChevronRight, Printer, Minus, Plus, ChefHat, Image as ImageIcon, ImageOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getRecipeBySlug, getPublishedRecipes, isFavorite, toggleFavorite, getAverageRating, addRating, getComments, addComment } from "@/lib/storage";
import { getCategoryBySlug } from "@/lib/categories";
import RatingStars from "@/components/RatingStars";
import RecipeCard from "@/components/RecipeCard";
import { PriceBadge } from "@/components/price-badge";
import { PaywallBox } from "@/hooks/paywall-box";
import { useDemoPurchase } from "@/hooks/use-demo-purchase";
import { ShareButtons } from "@/components/ShareButtons";
import { BackToTop } from "@/components/BackToTop";
import { ReadingProgress } from "@/components/ReadingProgress";

export default function RecipePage() {
  const { slug } = useParams<{ slug: string }>();
  const [params] = useSearchParams();
  const isPreview = params.get("preview") === "1";
  const recipe = getRecipeBySlug(slug || "");
  const [fav, setFav] = useState(() => recipe ? isFavorite(recipe.id) : false);
  const [rating, setRating] = useState<{ avg: number; count: number }>(() => recipe ? getAverageRating(recipe.id) : { avg: 0, count: 0 });
  const [comments, setComments] = useState(() => recipe ? getComments(recipe.id) : []);
  const [author, setAuthor] = useState("");
  const [commentText, setCommentText] = useState("");
  
  // Novos estados para monetização e porções
  const { isUnlocked } = useDemoPurchase();
  const [customServings, setCustomServings] = useState(1);
  const [printImages, setPrintImages] = useState(true);

  useEffect(() => {
    if (recipe) {
      setCustomServings(recipe.servings);
    }
    const storedPrintPref = localStorage.getItem("receitas_bell_print_images");
    if (storedPrintPref !== null) {
      setPrintImages(JSON.parse(storedPrintPref));
    }
  }, [recipe]);

  const scaleIngredient = (text: string) => {
    if (!recipe?.servings) return text;
    const factor = customServings / recipe.servings;
    const regex = /^((?:\d+\s+e\s+)?\d+(?:[.,]\d+)?(?:\s*\/\s*\d+)?)/i;
    const match = text.match(regex);
    if (!match) return text;
    const numberStr = match[0];
    const rest = text.substring(numberStr.length);
    let value = 0;
    const parts = numberStr.toLowerCase().split(' e ');
    parts.forEach(p => {
      if (p.includes('/')) {
        const [n, d] = p.split('/');
        value += parseFloat(n) / parseFloat(d);
      } else {
        value += parseFloat(p.replace(',', '.'));
      }
    });
    if (isNaN(value)) return text;
    const newValue = value * factor;
    const formattedValue = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(newValue);
    return `${formattedValue}${rest}`;
  };

  const togglePrintImages = () => {
    const newValue = !printImages;
    setPrintImages(newValue);
    localStorage.setItem("receitas_bell_print_images", JSON.stringify(newValue));
  };

  if (!recipe || (recipe.status === "draft" && !isPreview)) {
    return (
      <div className="container py-20 text-center">
        <h1 className="font-heading text-3xl font-bold">Receita não encontrada</h1>
        <Link to="/" className="mt-4 inline-block text-primary hover:underline">Voltar</Link>
      </div>
    );
  }

  const cat = getCategoryBySlug(recipe.categorySlug);
  const related = getPublishedRecipes().filter((r) => r.categorySlug === recipe.categorySlug && r.id !== recipe.id).slice(0, 3);
  
  // Lógica de Bloqueio
  const unlocked = isUnlocked(recipe.id, recipe.accessTier);
  const showPaywall = !unlocked && recipe.accessTier === "paid";
  
  const ingredients = showPaywall ? recipe.teaserIngredients : recipe.fullIngredients;
  const instructions = showPaywall ? recipe.teaserInstructions : recipe.fullInstructions;

  const handleFav = () => {
    toggleFavorite(recipe.id);
    setFav(!fav);
  };

  const handleRate = (v: number) => {
    addRating(recipe.id, v);
    setRating(getAverageRating(recipe.id));
  };

  const handleComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!author.trim() || !commentText.trim()) return;
    addComment(recipe.id, author.trim(), commentText.trim());
    setComments(getComments(recipe.id));
    setAuthor("");
    setCommentText("");
  };

  return (
    <div className="container max-w-3xl py-10 animate-in fade-in duration-500 print:py-0 print:max-w-none">
      <ReadingProgress />
      {isPreview && (
        <div className="mb-4 rounded-lg bg-warning/20 px-4 py-2 text-sm font-medium text-warning">
          ⚠️ Pré-visualização — esta receita é um rascunho.
        </div>
      )}

      {/* Breadcrumb */}
      <nav className="mb-4 flex items-center gap-1 text-sm text-muted-foreground print:hidden">
        <Link to="/" className="hover:text-primary">Home</Link>
        <ChevronRight className="h-3 w-3" />
        {cat && <Link to={`/categorias/${cat.slug}`} className="hover:text-primary">{cat.name}</Link>}
        <ChevronRight className="h-3 w-3" />
        <span className="truncate text-foreground">{recipe.title}</span>
      </nav>

      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold md:text-4xl print:text-2xl">{recipe.title}</h1>
          {recipe.description && <p className="mt-3 text-lg text-muted-foreground print:text-base">{recipe.description}</p>}
        </div>
        <div className="flex gap-2 print:hidden">
           <ShareButtons title={recipe.title} slug={recipe.slug} />
           <Button 
             variant="outline" 
             size="icon" 
             onClick={togglePrintImages} 
             title={printImages ? "Imprimir com imagens" : "Modo economia de tinta (sem imagens)"}
           >
             {printImages ? <ImageIcon className="h-4 w-4" /> : <ImageOff className="h-4 w-4" />}
           </Button>
           <Button variant="outline" size="icon" onClick={() => window.print()} title="Imprimir">
             <Printer className="h-4 w-4" />
           </Button>
        </div>
      </div>

      {recipe.image ? (
        <div className={`relative mt-6 overflow-hidden rounded-xl print:mt-4 print:rounded-none print:h-64 ${!printImages ? "print:hidden" : ""}`}>
          <img src={recipe.image} alt={recipe.title} className="w-full object-cover transition-transform hover:scale-105 print:object-contain print:h-full" style={{ maxHeight: 420 }} />
          <div className="absolute right-4 top-4 print:hidden">
             <PriceBadge accessTier={recipe.accessTier} priceCents={recipe.priceCents} className="shadow-lg scale-110" />
          </div>
        </div>
      ) : (
        <div className="mt-6 flex h-64 items-center justify-center rounded-xl bg-muted text-muted-foreground print:hidden">
          <ChefHat className="h-16 w-16 opacity-20" />
        </div>
      )}

      {/* Meta cards */}
      <div className="mt-6 flex flex-wrap gap-4 print:mt-4 print:gap-8">
        {recipe.totalTime > 0 && (
          <div className="flex items-center gap-2 rounded-lg border bg-card px-4 py-2 print:border-0 print:bg-transparent print:p-0">
            <Clock className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">{recipe.totalTime} min</span>
          </div>
        )}
        {recipe.servings > 0 && (
          <div className="flex items-center gap-2 rounded-lg border bg-card px-4 py-2 print:border-0 print:bg-transparent print:p-0">
            <Users className="h-4 w-4 text-primary" />
            <div className="flex items-center gap-2">
               <Button variant="ghost" size="icon" className="h-5 w-5 print:hidden" onClick={() => setCustomServings(s => Math.max(1, s - 1))}>
                 <Minus className="h-3 w-3" />
               </Button>
               <span className="text-sm font-medium">{customServings} porções</span>
               <Button variant="ghost" size="icon" className="h-5 w-5 print:hidden" onClick={() => setCustomServings(s => s + 1)}>
                 <Plus className="h-3 w-3" />
               </Button>
            </div>
          </div>
        )}
        {rating.count > 0 && (
          <div className="flex items-center gap-2 rounded-lg border bg-card px-4 py-2 print:hidden">
            <span className="text-sm font-medium">⭐ {rating.avg.toFixed(1)} ({rating.count})</span>
          </div>
        )}
      </div>

      {/* Favorite + Rate */}
      <div className="mt-6 flex flex-wrap items-center gap-4 print:hidden">
        <Button variant={fav ? "default" : "outline"} onClick={handleFav} className="gap-2">
          <Heart className={`h-4 w-4 ${fav ? "fill-current" : ""}`} />
          {fav ? "Salvo" : "Salvar nos favoritos"}
        </Button>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Sua nota:</span>
          <RatingStars onChange={handleRate} />
        </div>
      </div>

      {/* Tags */}
      {recipe.tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2 print:hidden">
          {recipe.tags.map((t) => <Badge key={t} variant="secondary">{t}</Badge>)}
        </div>
      )}

      <Separator className="my-8 print:my-4" />

      {/* Ingredients */}
      <h2 className="font-heading text-2xl font-bold print:text-xl">
        Ingredientes
        <span className="ml-2 text-base font-normal text-muted-foreground print:text-sm">
          (para {customServings} {customServings === 1 ? 'pessoa' : 'pessoas'})
        </span>
      </h2>
      <ul className="mt-4 space-y-2 print:space-y-1">
        {ingredients.map((ing, i) => (
          <li key={i} className="flex items-start gap-2 text-sm print:text-base">
            <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary print:bg-black print:mt-2" />
            {scaleIngredient(ing)}
          </li>
        ))}
        {showPaywall && (
           <li className="flex items-center justify-center p-4 text-sm text-muted-foreground italic bg-muted/30 rounded-lg border border-dashed">
             ... e mais ingredientes secretos
           </li>
        )}
      </ul>

      <Separator className="my-8 print:my-4" />

      {/* Steps */}
      <h2 className="font-heading text-2xl font-bold print:text-xl">Modo de Preparo</h2>
      <ol className="mt-4 space-y-4 print:space-y-2">
        {instructions.map((step, i) => (
          <li key={i} className="flex gap-4 rounded-lg border bg-card p-4 print:border-0 print:bg-transparent print:p-0 print:gap-2">
            <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground print:bg-transparent print:text-black print:border print:border-black print:h-6 print:w-6">
              {i + 1}
            </span>
            <p className="text-sm leading-relaxed print:text-base">{step}</p>
          </li>
        ))}
        {showPaywall && (
           <div className="p-4 text-center text-sm text-muted-foreground italic bg-muted/30 rounded-lg border border-dashed">
             ... passos detalhados bloqueados
           </div>
        )}
      </ol>

      {showPaywall && (
        <div className="mt-8 print:hidden">
          <PaywallBox price={recipe.priceCents || 0} recipeSlug={recipe.slug} />
        </div>
      )}

      <Separator className="my-8 print:hidden" />

      {/* Comments */}
      <h2 className="font-heading text-2xl font-bold print:hidden">Comentários ({comments.length})</h2>
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
            <h2 className="font-heading text-2xl font-bold">Quem gostou também viu</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {related.map((r) => <RecipeCard key={r.id} recipe={r} />)}
            </div>
          </>
        )}
      </div>

      <BackToTop />
    </div>
  );
}
