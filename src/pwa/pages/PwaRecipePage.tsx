import { useLocation, useParams, Link } from 'react-router-dom';
import { Heart, Clock, ChefHat, Flame, BarChart, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHead } from '@/components/PageHead';
import { getRecipeImage, getRecipePresentation } from '@/lib/recipes/presentation';
import { useRecipeBySlug } from '@/features/recipes/use-recipes';
import { buildPwaPath } from '@/pwa/app/navigation/pwa-paths';
import { resolvePwaTenantSlug } from '@/pwa/app/tenant/pwa-tenant-path';
import { useAppContext } from '@/contexts/app-context';
import { useFavorites } from '@/hooks/use-favorites';
import SmartImage from '@/components/SmartImage';
import { PriceBadge } from '@/components/price-badge';
import { useCart } from '@/hooks/use-cart';
import { buildCartItemFromRecipe } from '@/lib/utils/recipeAccess';
import { toast } from 'sonner';
import { useState } from 'react';

export default function PwaRecipePage() {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const tenantSlug = resolvePwaTenantSlug(location.pathname);
  const homePath = buildPwaPath('home', { tenantSlug });

  const { data: recipe, isLoading: loading } = useRecipeBySlug(slug);
  const [customServings, setCustomServings] = useState<number | null>(null);
  const { categories } = useAppContext();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { add: addToCart } = useCart();

  if (loading) {
    return (
      <div className="w-full space-y-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-48 w-full rounded-lg" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    );
  }

  if (!recipe || recipe.status === 'draft') {
    return (
      <div className="w-full py-12 text-center">
        <h1 className="text-xl font-bold text-foreground">Receita não encontrada</h1>
        <Link to={homePath} className="mt-4 inline-block text-sm text-primary hover:underline">
          Voltar
        </Link>
      </div>
    );
  }

  const cat = categories.find((category) => category.slug === recipe.categorySlug);
  const favorite = isFavorite(recipe.id);
  const imageUrl = getRecipeImage(recipe);
  const presentation = getRecipePresentation(recipe);
  const unlocked = recipe.accessTier === 'free' || Boolean(recipe.hasAccess);
  const baseServings = recipe.servings || 1;
  const currentServings = customServings ?? baseServings;

  async function handleFavorite() {
    if (!recipe) return;
    await toggleFavorite(recipe.id);
  }

  async function handleAddToCart() {
    if (!recipe) return;
    const item = buildCartItemFromRecipe(recipe);
    if (!item) {
      toast.error('Não foi possível adicionar ao carrinho.');
      return;
    }
    await addToCart(item);
    toast.success('Adicionado ao carrinho!');
  }

  return (
    <>
      <PageHead
        title={recipe.seoTitle || recipe.title}
        description={recipe.seoDescription || recipe.description || presentation.cardSubtitle}
        imageUrl={imageUrl}
        canonicalPath={`/pwa/app/receitas/${recipe.slug}`}
        ogType="article"
      />
      <div className="w-full space-y-4">
        {/* Header: Title and category */}
        <div>
          {cat && (
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {cat.name}
            </p>
          )}
          <h1 className="mt-1 text-xl font-bold leading-tight text-foreground">{recipe.title}</h1>
          {(recipe.description || presentation.cardSubtitle) && (
            <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
              {recipe.description || presentation.cardSubtitle}
            </p>
          )}
        </div>

        {/* Image */}
        {imageUrl ? (
          <div className="relative overflow-hidden rounded-lg bg-muted">
            <SmartImage
              src={imageUrl}
              alt={recipe.title}
              sizes="100vw"
              className="w-full object-cover aspect-video"
            />
            <div className="absolute right-2 top-2">
              <PriceBadge accessTier={recipe.accessTier} priceBRL={recipe.priceBRL} />
            </div>
          </div>
        ) : (
          <div className="flex h-48 w-full items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <ChefHat className="h-12 w-12 opacity-20" />
          </div>
        )}

        {/* Quick info: time, difficulty, calories */}
        <div className="flex flex-wrap gap-2">
          {(recipe?.totalTime ?? 0) > 0 && (
            <div className="flex h-10 items-center gap-1.5 rounded-lg border bg-card px-3">
              <Clock className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium">{recipe.totalTime}m</span>
            </div>
          )}
          {recipe.difficulty && (
            <div className="flex h-10 items-center gap-1.5 rounded-lg border bg-card px-3">
              <BarChart className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium">{recipe.difficulty}</span>
            </div>
          )}
          {recipe.calories && (
            <div className="flex h-10 items-center gap-1.5 rounded-lg border bg-card px-3">
              <Flame className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium">{recipe.calories} kcal</span>
            </div>
          )}
        </div>

        {/* Servings adjuster */}
        <div className="rounded-lg border bg-card p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Porções</span>
            <div className="flex h-10 items-center gap-2 rounded-lg border bg-background">
              <Button
                variant="ghost"
                size="sm"
                className="h-10 w-10"
                onClick={() => setCustomServings(Math.max(1, (customServings ?? baseServings) - 1))}
                aria-label="Diminuir porções"
              >
                <Minus className="h-3 w-3" />
              </Button>
              <span className="min-w-[2rem] text-center text-sm font-semibold">
                {currentServings}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-10 w-10"
                onClick={() => setCustomServings((customServings ?? baseServings) + 1)}
                aria-label="Aumentar porções"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <Button
            variant={favorite ? 'default' : 'outline'}
            className="h-12 flex-1 gap-2"
            onClick={() => void handleFavorite()}
          >
            <Heart className="h-4 w-4" />
            <span className="text-sm font-medium">{favorite ? 'Favorito' : 'Favoritar'}</span>
          </Button>
          {recipe.accessTier === 'paid' && !unlocked ? (
            <Button className="h-12 flex-1" onClick={() => void handleAddToCart()}>
              <span className="text-sm font-medium">Comprar</span>
            </Button>
          ) : null}
        </div>

        {/* Locked state */}
        {!unlocked && (
          <div className="rounded-lg border border-muted bg-muted/50 p-4 text-center">
            <p className="text-sm text-muted-foreground">
              Desbloqueie esta receita para ver ingredientes e modo de preparo.
            </p>
          </div>
        )}

        {/* Ingredients and instructions only if unlocked */}
        {unlocked && (
          <>
            {recipe.fullIngredients && recipe.fullIngredients.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-base font-bold">Ingredientes</h2>
                <ul className="space-y-2">
                  {recipe.fullIngredients.map((ingredient, idx) => (
                    <li key={idx} className="flex gap-2 text-sm text-foreground">
                      <span className="text-primary">•</span>
                      <span>{ingredient}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {recipe.fullInstructions && recipe.fullInstructions.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-base font-bold">Modo de Preparo</h2>
                <ol className="space-y-3">
                  {recipe.fullInstructions.map((instruction, idx) => (
                    <li key={idx} className="flex gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {idx + 1}
                      </span>
                      <p className="pt-0.5 text-sm leading-relaxed text-foreground">
                        {instruction}
                      </p>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
