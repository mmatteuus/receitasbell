import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Reveal } from '@/components/motion/Reveal';
import SmartImage from '@/components/SmartImage';
import { getRecipeImage } from '@/lib/recipes/presentation';
import type { RecipeRecord } from '@/lib/recipes/types';
import type { RecipePresentation } from '@/lib/recipes/presentation';
import type { SettingsMap } from '@/types/settings';
import { useEffect, useMemo, useRef, useState } from 'react';

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
  const recipes = useMemo(() => featuredRecipes ?? [], [featuredRecipes]);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const firstItemRef = useRef<HTMLAnchorElement | null>(null);
  const [stepPx, setStepPx] = useState<number>(0);
  const [visibleCount, setVisibleCount] = useState<number>(3);
  const [index, setIndex] = useState<number>(0);

  useEffect(() => {
    const updateVisible = () => {
      const w = window.innerWidth;
      if (w >= 1024) setVisibleCount(3);
      else if (w >= 768) setVisibleCount(2);
      else setVisibleCount(1);
    };
    updateVisible();
    window.addEventListener('resize', updateVisible);
    return () => window.removeEventListener('resize', updateVisible);
  }, []);

  useEffect(() => {
    const measure = () => {
      const el = firstItemRef.current;
      if (!el) return;
      // Use the rendered card width as the scroll step (gap handled by the container padding).
      setStepPx(el.getBoundingClientRect().width + 16); // gap-4 ~= 16px
    };
    measure();
    const ro = new ResizeObserver(() => measure());
    if (firstItemRef.current) ro.observe(firstItemRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!scrollerRef.current) return;
    if (!stepPx) return;
    const maxIndex = Math.max(0, recipes.length - visibleCount);
    const nextIndex = Math.min(index, maxIndex);
    if (nextIndex !== index) setIndex(nextIndex);
    scrollerRef.current.scrollTo({ left: nextIndex * stepPx, behavior: 'smooth' });
  }, [index, recipes.length, stepPx, visibleCount]);

  useEffect(() => {
    if (loading) return;
    if (recipes.length <= visibleCount) return;
    const maxIndex = Math.max(0, recipes.length - visibleCount);
    const timer = window.setInterval(() => {
      setIndex((current) => (current >= maxIndex ? 0 : current + 1));
    }, 4500);
    return () => window.clearInterval(timer);
  }, [loading, recipes.length, visibleCount]);

  return (
    <section className="container px-4 py-12">
      <Reveal>
        <div className="mb-7 space-y-2">
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
      ) : recipes.length > 0 && featuredMainRecipe ? (
        <div className="space-y-5">
          <Reveal>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">
                  {featuredMainPresentation?.cardTitle || featuredMainRecipe.title}
                </span>
                {featuredMainPresentation?.marketingHeadline || featuredMainRecipe.description ? (
                  <span className="hidden sm:inline">
                    {' '}
                    -{' '}
                    {featuredMainPresentation?.marketingHeadline || featuredMainRecipe.description}
                  </span>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIndex((current) => Math.max(0, current - 1))}
                  aria-label="Anterior"
                >
                  Anterior
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIndex((current) => current + 1)}
                  aria-label="Próximo"
                >
                  Proximo
                </Button>
              </div>
            </div>
          </Reveal>

          <Reveal>
            <div
              ref={scrollerRef}
              className="hide-scrollbar overflow-x-auto scroll-smooth snap-x snap-mandatory"
              aria-label="Carrossel da selecao editorial"
            >
              <div className="flex gap-4 pb-2">
                {recipes.map((recipe, i) => (
                  <Link
                    key={recipe.id}
                    ref={i === 0 ? firstItemRef : undefined}
                    to={`/receitas/${recipe.slug}`}
                    className="group relative w-full shrink-0 basis-full overflow-hidden rounded-2xl border bg-card shadow-sm md:basis-1/2 lg:basis-1/3 snap-start"
                    onClick={() => onFeaturedClick(recipe)}
                  >
                    <SmartImage
                      src={getRecipeImage(recipe)}
                      fallbackSrc="/placeholder.svg"
                      alt={recipe.title}
                      sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                      className="h-56 w-full object-cover sm:h-64 lg:h-52"
                    />
                    {/* Image-led card (desktop stays compact and shows 3 per row). */}
                    <div className="pointer-events-none absolute inset-x-0 bottom-0">
                      <div className="bg-gradient-to-t from-black/70 via-black/35 to-transparent px-4 pb-4 pt-10">
                        <div className="flex items-center gap-2 text-[11px] text-white/80">
                          <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-2 py-0.5 capitalize">
                            {recipe.categorySlug}
                          </span>
                          <span>{recipe.totalTime} min</span>
                        </div>
                        <div className="mt-1 text-base font-semibold leading-snug text-white group-hover:underline">
                          {recipe.title}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </Reveal>

          {onViewRelated && (
            <div className="flex justify-center pt-2">
              <Button variant="outline" onClick={onViewRelated}>
                Explorar outras receitas
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed px-6 py-14 text-center text-muted-foreground">
          Nenhuma receita disponível no momento.
        </div>
      )}
    </section>
  );
}
