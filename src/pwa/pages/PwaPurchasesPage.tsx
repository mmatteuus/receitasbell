import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { WalletCards } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LastSyncBadge } from "@/pwa/offline/ui/LastSyncBadge";
import { getProfileOverview } from "@/lib/repos/profileRepo";
import type { RecipeRecord } from "@/lib/recipes/types";
import { getRecipePresentation } from "@/lib/recipes/presentation";
import { buildPwaPath } from "@/pwa/app/navigation/pwa-paths";
import { resolvePwaTenantSlug } from "@/pwa/app/tenant/pwa-tenant-path";
import { logger } from "@/lib/logger";

export default function PwaPurchasesPage() {
  const location = useLocation();
  const tenantSlug = resolvePwaTenantSlug(location.pathname);
  const [loading, setLoading] = useState(true);
  const [recipes, setRecipes] = useState<RecipeRecord[]>([]);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      try {
        const overview = await getProfileOverview();
        if (!active) {
          return;
        }
        setRecipes(overview.purchasedRecipes);
        setLastSyncedAt(overview.lastSyncedAt || null);
      } catch (error) {
        logger.error("pwa.purchases", error);
        if (active) {
          setRecipes([]);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28 w-full rounded-2xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <Card className="border-border/70">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <WalletCards className="h-5 w-5 text-primary" />
          Minhas Compras
        </CardTitle>
        <CardDescription>
          Receitas premium desbloqueadas para este dispositivo.
        </CardDescription>
        <LastSyncBadge lastSyncedAt={lastSyncedAt} />
      </CardHeader>
      <CardContent>
        {recipes.length > 0 ? (
          <div className="space-y-2">
            {recipes.map((recipe) => (
              <Link
                key={recipe.id}
                to={buildPwaPath("recipe", { tenantSlug, slug: recipe.slug })}
                className="flex items-center justify-between rounded-lg border px-3 py-3 text-sm hover:bg-muted/30"
              >
                <span>{getRecipePresentation(recipe).cardTitle}</span>
                <span className="text-muted-foreground">Acesso ativo</span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
            Nenhuma compra registrada para este e-mail até agora.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
