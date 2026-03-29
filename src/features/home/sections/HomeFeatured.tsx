import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Reveal } from "@/components/motion/Reveal";
import SmartImage from "@/components/SmartImage";
import { getRecipeImage } from "@/lib/recipes/presentation";
import type { RecipeRecord } from "@/lib/recipes/types";
import type { RecipePresentation } from "@/lib/recipes/presentation";
import type { SettingsMap } from "@/types/settings";

type HomeFeaturedProps = {
  settings: SettingsMap;
  loading: boolean;
  featuredRecipes: RecipeRecord[];
  featuredMainRecipe: RecipeRecord | null;
  featuredMainPresentation: RecipePresentation | null;
  featuredCategoryLabel?: string | null;
  onFeaturedClick: (recipe: RecipeRecord) => void;
  onViewRelated?: () => void;
};

export function HomeFeatured({
  settings,
  loading,
  featuredRecipes,
  featuredMainRecipe,
  featuredMainPresentation,
  featuredCategoryLabel,
  onFeaturedClick,
  onViewRelated,
}: HomeFeaturedProps) {
  return (
    <section className="container px-4 py-12">
      <Reveal>
        <div className="mb-7 space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Curadoria editorial
          </p>
          <h2 className="text-3xl">{settings.featuredSectionTitle}</h2>
          <p className="max-w-2xl text-muted-foreground">{settings.featuredSectionSubtitle}</p>
        </div>
      </Reveal>
      {loading ? (
        <div className="grid gap-5 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-[340px] rounded-2xl" />
          ))}
        </div>
      ) : featuredRecipes.length > 0 && featuredMainRecipe ? (
        <div className="mx-auto max-w-4xl">
          <Reveal>
            <article className="overflow-hidden rounded-3xl border bg-card shadow-sm">
              <Link to={`/receitas/${featuredMainRecipe.slug}`} className="block">
                <SmartImage
                  src={getRecipeImage(featuredMainRecipe)}
                  alt={featuredMainRecipe.title}
                  sizes="(min-width: 1024px) 100vw, 100vw"
                  className="h-[400px] w-full object-cover lg:h-[500px]"
                />
              </Link>
              <div className="flex flex-col items-center space-y-4 p-8 text-center sm:p-12">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline" className="capitalize">
                    {featuredCategoryLabel || featuredMainRecipe.categorySlug}
                  </Badge>
                  <span>{featuredMainRecipe.totalTime} min</span>
                </div>
                <h3 className="text-3xl font-bold leading-tight md:text-4xl">
                  {featuredMainPresentation?.cardTitle || featuredMainRecipe.title}
                </h3>
                <p className="max-w-2xl text-base text-muted-foreground md:text-lg">
                  {featuredMainPresentation?.marketingHeadline || featuredMainRecipe.description}
                </p>
                <div className="pt-4 flex flex-col sm:flex-row items-center gap-4">
                  <Button
                    onClick={() => onFeaturedClick(featuredMainRecipe)}
                    className="gap-2"
                    size="lg"
                  >
                    Ver receita
                    <ArrowRight aria-hidden="true" className="h-4 w-4" />
                  </Button>
                  {onViewRelated && (
                    <Button variant="outline" size="lg" onClick={onViewRelated}>
                      Explorar outras receitas
                    </Button>
                  )}
                </div>
              </div>
            </article>
          </Reveal>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed px-6 py-14 text-center text-muted-foreground">
          Nenhuma receita disponível para a curadoria selecionada.
        </div>
      )}
    </section>
  );
}
