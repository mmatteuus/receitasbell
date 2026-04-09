import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Heart } from "lucide-react";
import { PageHead } from "@/components/PageHead";
import { listFavoritesOfflineAware } from "@/pwa/offline/repos/favorites-offline-repo";
import { getRecipeSnapshotsByIds } from "@/pwa/offline/cache/recipe-snapshot";
import type { FavoriteRecord } from "@/lib/api/interactions";
import type { RecipeRecord } from "@/lib/recipes/types";
import { getRecipeImage, getRecipePresentation } from "@/lib/recipes/presentation";
import SmartImage from "@/components/SmartImage";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { buildPwaPath } from "@/pwa/app/navigation/pwa-paths";
import { resolvePwaTenantSlug } from "@/pwa/app/tenant/pwa-tenant-path";
import { PWA_OFFLINE_DATA_CHANGED_EVENT } from "@/pwa/offline/events";
import { useOfflineStatus } from "@/pwa/offline/hooks/useOfflineStatus";

type FavoriteWithRecipe = FavoriteRecord & { recipe?: RecipeRecord };

export default function PwaFavoritesPage() {
  const location = useLocation();
  const tenantSlug = resolvePwaTenantSlug(location.pathname);
  const { offline } = useOfflineStatus();
  const [favorites, setFavorites] = useState<FavoriteWithRecipe[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadFavorites() {
    try {
      const records = await listFavoritesOfflineAware();
      const recipeIds = records.map((r) => r.recipeId);
      const snapshotRecipes = await getRecipeSnapshotsByIds(recipeIds).catch(() => [] as RecipeRecord[]);
      const recipeMap = new Map(snapshotRecipes.map((r) => [r.id, r]));
      const enriched = records.map((fav) => ({ ...fav, recipe: recipeMap.get(fav.recipeId) }));
      setFavorites(enriched);
    } catch {
      // silencioso — lista pode estar vazia
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadFavorites();
    const handleChange = () => void loadFavorites();
    window.addEventListener(PWA_OFFLINE_DATA_CHANGED_EVENT, handleChange);
    return () => window.removeEventListener(PWA_OFFLINE_DATA_CHANGED_EVENT, handleChange);
  }, []);

  return (
    <>
      <PageHead title="Favoritos" noindex />
      <div className="space-y-6 pb-8 animate-in fade-in duration-500">
        <section className="flex items-center gap-3 px-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600">
            <Heart className="h-5 w-5 fill-current" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Meus Favoritos</h1>
        </section>

        {loading ? (
          <div className="grid gap-4 grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-40 rounded-2xl" />
            ))}
          </div>
        ) : favorites.length > 0 ? (
          <div className="grid gap-4 grid-cols-2">
            {favorites.map((fav) => {
              const recipe = fav.recipe;
              if (!recipe) {
                return (
                  <div
                    key={fav.recipeId}
                    className="rounded-2xl border bg-card/50 p-4 flex flex-col gap-2"
                  >
                    <div className="h-20 bg-muted rounded-xl" />
                    <p className="text-xs text-muted-foreground">Receita não disponível offline</p>
                  </div>
                );
              }
              const presentation = getRecipePresentation(recipe);
              return (
                <Link
                  key={fav.recipeId}
                  to={buildPwaPath("recipe", { tenantSlug, slug: recipe.slug })}
                  className="group rounded-2xl border bg-card/50 overflow-hidden active:scale-95 transition-transform"
                >
                  <div className="relative h-32 w-full bg-muted overflow-hidden">
                    <SmartImage
                      src={getRecipeImage(recipe)}
                      alt={recipe.title}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-bold line-clamp-2 leading-tight">
                      {presentation.cardTitle}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 text-center py-16 border-2 border-dashed rounded-2xl">
            <div className="p-4 bg-muted rounded-full">
              <Heart className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold">Nenhum favorito ainda</h2>
            <p className="text-sm text-muted-foreground max-w-xs">
              {offline
                ? "Seus favoritos aparecerão aqui após sincronizarem online."
                : "Explore o catálogo e salve suas receitas favoritas."}
            </p>
            {!offline && (
              <Link to={buildPwaPath("search", { tenantSlug })}>
                <Button size="sm">Explorar receitas</Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </>
  );
}
