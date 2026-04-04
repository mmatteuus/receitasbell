import { Link, useLocation } from "react-router-dom";
import { Clock, Users, Heart, ShoppingCart } from "lucide-react";
import type { RecipeRecord } from "@/lib/recipes/types";
import { PriceBadge } from "@/components/price-badge";
import { useFavorites } from "@/hooks/use-favorites";
import { useCart } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getRecipeImage, getRecipePresentation } from "@/lib/recipes/presentation";
import { useAppContext } from "@/contexts/app-context";
import { resolveCategoryDisplay } from "@/lib/categoriesDisplay";
import SmartImage from "@/components/SmartImage";
import { buildCartItemFromRecipe } from "@/lib/utils/recipeAccess";
import { buildPwaPath } from "@/pwa/app/navigation/pwa-paths";
import { resolvePwaTenantSlug } from "@/pwa/app/tenant/pwa-tenant-path";

interface RecipeCardProps {
  recipe: RecipeRecord;
}

export default function RecipeCard({ recipe }: RecipeCardProps) {
  const location = useLocation();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { has: inCart, add: addToCart } = useCart();
  const { categories } = useAppContext();
  const isFav = isFavorite(recipe.id);
  const isPaid = recipe.accessTier === "paid";
  const unlocked = recipe.accessTier === "free" || Boolean(recipe.hasAccess);
  const blocked = isPaid && !unlocked;
  const imageUrl = getRecipeImage(recipe);
  const presentation = getRecipePresentation(recipe);
  const category = resolveCategoryDisplay(categories, recipe.categorySlug);
  const tenantSlug = resolvePwaTenantSlug(location.pathname);
  const recipePath = location.pathname.includes("/pwa")
    ? buildPwaPath("recipe", { tenantSlug, slug: recipe.slug })
    : `/receitas/${recipe.slug}`;

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
  }

  return (
    <div
      className="card-glow group relative flex flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/5"
      onMouseMove={handleMouseMove}
    >
      <Link to={recipePath} className="relative aspect-[4/3] overflow-hidden">
        <SmartImage
          src={imageUrl}
          fallbackSrc="/placeholder.svg"
          alt={recipe.title}
          sizes="(min-width: 1024px) 320px, (min-width: 640px) 45vw, 100vw"
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-black/5 to-transparent" />
        <div className="absolute left-2.5 top-2.5">
          <PriceBadge accessTier={recipe.accessTier} priceBRL={recipe.priceBRL} />
        </div>
        <div className="absolute right-2.5 top-2.5">
          <Button
            variant="secondary"
            size="icon"
            className="h-8 w-8 rounded-full bg-background/90 shadow-md backdrop-blur-sm transition-all hover:scale-110 hover:bg-background hover:text-red-500 dark:bg-card/70 dark:hover:bg-card"
            onClick={(e) => {
              e.preventDefault();
              void toggleFavorite(recipe.id);
            }}
          >
            <Heart aria-hidden="true" className={`h-4 w-4 transition-all duration-300 ${isFav ? "fill-red-500 text-red-500 scale-110" : "text-muted-foreground"}`} />
            <span className="sr-only">Favoritar</span>
          </Button>
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="mb-2">
          <Badge variant="outline" className="text-xs font-normal capitalize transition-colors group-hover:border-primary/30 group-hover:text-primary">
            {category.label}
          </Badge>
        </div>

        <Link to={recipePath} className="link-underline">
          <h3 className="line-clamp-2 font-heading text-base font-bold leading-tight text-foreground sm:text-lg">
            {presentation.cardTitle}
          </h3>
        </Link>

        <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground sm:mt-2">
          {presentation.cardSubtitle}
        </p>

        <div className="mt-auto flex items-center gap-4 pt-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Clock aria-hidden="true" className="h-3.5 w-3.5 text-primary/60" />
            <span>{recipe.totalTime} min</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users aria-hidden="true" className="h-3.5 w-3.5 text-primary/60" />
            <span>{recipe.servings} porções</span>
          </div>
        </div>

        {blocked && (
          <Button
            size="sm"
            className="mt-3 w-full gap-2 rounded-xl bg-gradient-to-r from-primary to-orange-600 text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/20 disabled:opacity-75 disabled:dark:opacity-80"
            onClick={(e) => { e.preventDefault(); addToCart(buildCartItemFromRecipe(recipe)); }}
            disabled={inCart(recipe.id)}
          >
            <ShoppingCart aria-hidden="true" className="h-3.5 w-3.5" />
            {inCart(recipe.id) ? "No carrinho ✓" : "Adicionar ao carrinho"}
          </Button>
        )}
      </div>
    </div>
  );
}
