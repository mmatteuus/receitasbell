import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Reveal } from '@/components/motion/Reveal';
import SmartImage from '@/components/SmartImage';
import { getRecipeImage } from '@/lib/recipes/presentation';
import type { RecipeRecord } from '@/lib/recipes/types';
import type { RecipePresentation } from '@/lib/recipes/presentation';
import type { SettingsMap } from '@/types/settings';
import { useCallback, useEffect, useRef, useState } from 'react';
import { resolveCategoryDisplay } from '@/lib/categoriesDisplay';
import { useAppContext } from '@/contexts/app-context';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Número de cards visíveis por breakpoint
const VISIBLE = { mobile: 1, tablet: 2, desktop: 3 };
const GAP_PX = 16; // gap-4

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

const AUTOPLAY_MS = 4000;

export function HomeFeatured({
  settings,
  loading,
  featuredRecipes,
  featuredMainRecipe,
  featuredMainPresentation,
  onFeaturedClick,
  onViewRelated,
}: HomeFeaturedProps) {
  const { categories } = useAppContext();
  const recipes = featuredRecipes ?? [];
  const total = recipes.length;

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [visibleCount, setVisibleCount] = useState(VISIBLE.mobile);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  // Detecta quantos cards cabem baseado na largura da janela
  useEffect(() => {
    function update() {
      const w = window.innerWidth;
      if (w >= 1024) setVisibleCount(VISIBLE.desktop);
      else if (w >= 768) setVisibleCount(VISIBLE.tablet);
      else setVisibleCount(VISIBLE.mobile);
    }
    update();
    window.addEventListener('resize', update, { passive: true });
    return () => window.removeEventListener('resize', update);
  }, []);

  const maxIndex = Math.max(0, total - visibleCount);

  const go = useCallback(
    (next: number) => {
      setIndex(Math.min(Math.max(next, 0), maxIndex));
    },
    [maxIndex],
  );

  const prev = useCallback(() => go(index - 1), [go, index]);
  const next = useCallback(() => go(index + 1), [go, index]);

  // Auto-play: avança até o fim e volta ao início
  useEffect(() => {
    if (loading || total < 2 || paused) return;
    timerRef.current = setInterval(() => {
      setIndex((cur) => (cur >= maxIndex ? 0 : cur + 1));
    }, AUTOPLAY_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [loading, total, paused, maxIndex]);

  if (loading) {
    return (
      <section className="container px-4 py-12">
        <Reveal>
          <div className="mb-7 space-y-2">
            <div className="h-9 w-48 rounded bg-muted animate-pulse" />
            <div className="h-4 w-72 rounded bg-muted animate-pulse" />
          </div>
        </Reveal>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[340px] rounded-2xl" />
          ))}
        </div>
      </section>
    );
  }

  if (!total || !featuredMainRecipe) {
    return (
      <section className="container px-4 py-12">
        <div className="rounded-2xl border border-dashed px-6 py-14 text-center text-muted-foreground">
          Nenhuma receita disponível no momento.
        </div>
      </section>
    );
  }

  // Calcula a largura percentual de cada card no track (inclui gap)
  // cardWidth = (100% / visibleCount), translate = index * (cardWidth + gap relativo)
  // Usamos calc com px para compensar os gaps
  const cardWidthPct = 100 / visibleCount;
  const translateValue = `calc(-${index * cardWidthPct}% - ${index * GAP_PX}px)`;

  return (
    <section className="container px-4 py-12">
      <Reveal>
        <div className="mb-7 space-y-2">
          <h2 className="text-3xl">{settings.featuredSectionTitle}</h2>
          <p className="max-w-2xl text-muted-foreground">{settings.featuredSectionSubtitle}</p>
        </div>
      </Reveal>

      <div
        className="space-y-4"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* Cabeçalho com título e controles */}
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground line-clamp-1 hidden sm:block">
            <span className="font-medium text-foreground">
              {recipes[index]?.title}
            </span>
          </p>

          <div className="flex items-center gap-2 ml-auto shrink-0">
            {/* Indicadores — um por posição possível */}
            {maxIndex > 0 && (
              <div className="flex gap-1.5 mr-2">
                {Array.from({ length: maxIndex + 1 }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => go(i)}
                    aria-label={`Ir para posição ${i + 1}`}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === index ? 'w-5 bg-primary' : 'w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/60'
                    }`}
                  />
                ))}
              </div>
            )}
            <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={prev} disabled={index === 0} aria-label="Anterior">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={next} disabled={index >= maxIndex} aria-label="Próximo">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Carrossel */}
        <div className="overflow-hidden" aria-label="Carrossel de receitas em destaque">
          <div
            ref={trackRef}
            className="flex gap-4 transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(${translateValue})` }}
          >
            {recipes.map((recipe, i) => (
              <Link
                key={recipe.id}
                to={`/receitas/${recipe.slug}`}
                onClick={() => onFeaturedClick(recipe)}
                aria-label={recipe.title}
                style={{ width: `calc(${cardWidthPct}% - ${GAP_PX * (visibleCount - 1) / visibleCount}px)` }}
                className="group relative shrink-0 overflow-hidden rounded-2xl border bg-card shadow-sm"
              >
                <SmartImage
                  src={getRecipeImage(recipe)}
                  fallbackSrc="/placeholder.svg"
                  alt={recipe.title}
                  priority={i === 0}
                  sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                  className="h-48 w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="pointer-events-none absolute inset-x-0 bottom-0">
                  <div className="bg-gradient-to-t from-black/70 via-black/35 to-transparent px-4 pb-4 pt-10">
                    <div className="flex items-center gap-2 text-[11px] text-white/80">
                      <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-2 py-0.5 capitalize">
                        {resolveCategoryDisplay(categories, recipe.categorySlug).label}
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

        {onViewRelated && (
          <div className="flex justify-center pt-1">
            <Button variant="outline" onClick={onViewRelated}>
              Explorar outras receitas
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
