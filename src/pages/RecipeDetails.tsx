import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { Clock, Users, ChefHat, Printer, Minus, Plus } from "lucide-react";
import { getRecipeBySlug } from "@/lib/storage";
import { Recipe } from "@/types/recipe";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { PriceBadge } from "@/components/price-badge";
import { PaywallBox } from "@/hooks/paywall-box";
import { useDemoPurchase } from "@/hooks/use-demo-purchase";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { RelatedRecipes } from "@/components/RelatedRecipes";
import { RecipeRating } from "@/components/RecipeRating";
import { ShareButtons } from "@/components/ShareButtons";

export default function RecipeDetails() {
  const { slug } = useParams<{ slug: string }>();
  const recipe = slug ? getRecipeBySlug(slug) : undefined;
  const { isUnlocked } = useDemoPurchase();

  const [customServings, setCustomServings] = useState(1);

  useEffect(() => {
    if (recipe) {
      setCustomServings(recipe.servings);
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

  if (!recipe) {
    return (
      <div className="container flex min-h-[50vh] flex-col items-center justify-center gap-4 py-20 text-center">
        <h1 className="text-3xl font-bold">Receita não encontrada</h1>
        <p className="text-muted-foreground">A receita que você procura não existe ou foi removida.</p>
        <Button asChild variant="outline"><Link to="/">Voltar para o início</Link></Button>
      </div>
    );
  }

  const unlocked = isUnlocked(recipe.id, recipe.accessTier);
  const showPaywall = !unlocked && recipe.accessTier === "paid";
  const ingredients = showPaywall ? (recipe.teaserIngredients || []) : recipe.ingredients;
  const instructions = showPaywall ? (recipe.teaserInstructions || []) : recipe.instructions;

  return (
    <div className="container py-10 animate-in fade-in duration-500">
      <Breadcrumbs
        items={[
          { label: "Receitas", href: "/" },
          { label: recipe.categorySlug, href: `/categorias/${recipe.categorySlug}` },
          { label: recipe.title },
        ]}
        className="mb-8 print:hidden"
      />

      <div className="grid gap-8 lg:grid-cols-2 print:block">
        <div className="space-y-6">
          <div className="relative aspect-video w-full overflow-hidden rounded-xl border bg-muted shadow-sm">
            {recipe.image ? (
              <img src={recipe.image} alt={recipe.title} className="h-full w-full object-cover transition-transform hover:scale-105" />
            ) : (
              <div className="flex h-full items-center justify-center bg-muted text-muted-foreground"><ChefHat className="h-20 w-20 opacity-20" /></div>
            )}
            <div className="absolute right-4 top-4">
              <PriceBadge accessTier={recipe.accessTier} priceCents={recipe.priceCents} className="shadow-lg scale-110" />
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-center space-y-6">
          <div>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="capitalize">{recipe.categorySlug}</Badge>
                {recipe.tags?.map(tag => (<Badge key={tag} variant="outline" className="capitalize">{tag}</Badge>))}
              </div>
              <div className="flex items-center gap-2">
                <ShareButtons title={recipe.title} slug={recipe.slug} />
                <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-2 print:hidden">
                  <Printer className="h-4 w-4" /> Imprimir
                </Button>
              </div>
            </div>
            <h1 className="font-heading text-4xl font-bold leading-tight text-foreground sm:text-5xl">{recipe.title}</h1>
            <p className="mt-4 text-lg text-muted-foreground leading-relaxed">{recipe.description}</p>
          </div>

          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-3 rounded-lg border p-3 bg-card/50">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"><Clock className="h-5 w-5" /></div>
              <div><p className="text-xs font-medium text-muted-foreground">Tempo</p><p className="font-semibold">{recipe.totalTime} min</p></div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border p-3 bg-card/50">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"><Users className="h-5 w-5" /></div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Porções</p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" className="h-6 w-6 print:hidden" onClick={() => setCustomServings(s => Math.max(1, s - 1))}><Minus className="h-3 w-3" /></Button>
                  <p className="font-semibold">{customServings} pessoas</p>
                  <Button variant="outline" size="icon" className="h-6 w-6 print:hidden" onClick={() => setCustomServings(s => s + 1)}><Plus className="h-3 w-3" /></Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Separator className="my-12" />

      <div className="grid gap-12 md:grid-cols-[1fr_1fr] print:block print:gap-6">
        <div className="space-y-6">
          <h2 className="font-heading text-2xl font-semibold flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold">1</span>
            Ingredientes
          </h2>
          <ul className="space-y-3">
            {ingredients.map((ingredient, index) => (
              <li key={index} className="flex items-start gap-3 rounded-lg border p-3 text-sm transition-colors hover:bg-muted/50">
                <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <span className="leading-relaxed">{scaleIngredient(ingredient)}</span>
              </li>
            ))}
            {showPaywall && (
              <li className="flex items-center justify-center p-4 text-sm text-muted-foreground italic bg-muted/30 rounded-lg border border-dashed">... e mais ingredientes secretos</li>
            )}
          </ul>
        </div>

        <div className="space-y-6">
          <h2 className="font-heading text-2xl font-semibold flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold">2</span>
            Modo de Preparo
          </h2>
          <div className="space-y-6">
            {instructions.map((step, index) => (
              <div key={index} className="group relative flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-background text-sm font-bold text-primary shadow-sm group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">{index + 1}</div>
                <p className="pt-1 text-base leading-relaxed text-muted-foreground group-hover:text-foreground transition-colors">{step}</p>
              </div>
            ))}
            {showPaywall && (
              <div className="p-4 text-center text-sm text-muted-foreground italic bg-muted/30 rounded-lg border border-dashed">... passos detalhados bloqueados</div>
            )}
          </div>
        </div>
      </div>

      {showPaywall && (
        <div className="mt-16 print:hidden">
          <PaywallBox price={recipe.priceCents || 0} recipeSlug={recipe.slug} />
        </div>
      )}

      <div className="print:hidden">
        <RecipeRating recipeId={recipe.id} />
      </div>

      <div className="print:hidden">
        <RelatedRecipes currentRecipeId={recipe.id} categorySlug={recipe.categorySlug} />
      </div>
    </div>
  );
}
