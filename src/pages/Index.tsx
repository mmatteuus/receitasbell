import { useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { PageHead } from "@/components/PageHead";
import { useAppContext } from "@/contexts/app-context";
import { usePublicRecipes } from "@/features/recipes/use-recipes";
import { pickFeaturedRecipes, pickGratinRecipes, pickPremiumRecipes } from "@/lib/home/curation";
import { getRecipePresentation } from "@/lib/recipes/presentation";
import { resolveCategoryDisplay } from "@/lib/categoriesDisplay";
import { trackEvent } from "@/lib/telemetry";
import { RECENT_RECIPES_KEY } from "@/lib/constants";
import type { RecipeRecord } from "@/lib/recipes/types";
import { HomeHero } from "@/features/home/sections/HomeHero";
import { HomeTrustBar } from "@/features/home/sections/HomeTrustBar";
import { HomeCategories } from "@/features/home/sections/HomeCategories";
import { HomeFeatured } from "@/features/home/sections/HomeFeatured";
import { HomePremium } from "@/features/home/sections/HomePremium";
import { HomeGratin } from "@/features/home/sections/HomeGratin";
import { HomeRecent } from "@/features/home/sections/HomeRecent";
import { HomeAbout } from "@/features/home/sections/HomeAbout";
import { HomeNewsletter } from "@/features/home/sections/HomeNewsletter";

export default function HomePage() {
  const { data: recipes = [], isLoading: loading, isError, refetch } = usePublicRecipes();
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const { categories, settings, theme, toggleTheme } = useAppContext();
  const premiumRef = useRef<HTMLDivElement>(null);

  const recentRecipes = useMemo(() => {
    try {
      const historyIds = JSON.parse(localStorage.getItem(RECENT_RECIPES_KEY) || "[]");
      if (!Array.isArray(historyIds) || historyIds.length === 0) return [];
      return historyIds
        .map((id: string) => recipes.find((recipe) => recipe.id === id))
        .filter((recipe): recipe is RecipeRecord => Boolean(recipe));
    } catch {
      return [];
    }
  }, [recipes]);

  const featuredRecipes = useMemo(
    () => pickFeaturedRecipes(recipes, settings),
    [recipes, settings],
  );
  const featuredMainRecipe = featuredRecipes[0] ?? null;
  const featuredMainPresentation = featuredMainRecipe
    ? getRecipePresentation(featuredMainRecipe)
    : null;
  const premiumRecipes = useMemo(
    () => pickPremiumRecipes(recipes, featuredRecipes, 4),
    [featuredRecipes, recipes],
  );

  const gratinRecipes = useMemo(() => pickGratinRecipes(recipes, 4), [recipes]);

  const featuredCategoryDisplay = featuredMainRecipe
    ? resolveCategoryDisplay(categories, featuredMainRecipe.categorySlug)
    : null;

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!searchTerm.trim()) return;
    trackEvent("home.search.submit", { q: searchTerm.trim() });
    navigate(`/buscar?q=${encodeURIComponent(searchTerm)}`);
  };

  const sections: Record<string, ReactNode> = {
    hero: (
      <HomeHero
        settings={settings}
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
        onSearchSubmit={handleSearch}
        onPrimaryCta={() => navigate(settings.heroPrimaryCtaHref || "/buscar")}
        onSecondaryCta={() => navigate(settings.heroSecondaryCtaHref || "/buscar")}
      />
    ),
    trustBar: settings.showTrustBar && settings.trustBarItems.length > 0 && (
      <HomeTrustBar items={settings.trustBarItems} />
    ),
    categories: settings.showCategoriesGrid && (
      <HomeCategories
        categories={categories}
        onBrowseAll={() => navigate("/buscar")}
      />
    ),
    featured: settings.showFeaturedRecipes && (
      <HomeFeatured
        settings={settings}
        loading={loading}
        featuredRecipes={featuredRecipes}
        featuredMainRecipe={featuredMainRecipe}
        featuredMainPresentation={featuredMainPresentation}
        featuredCategoryLabel={featuredCategoryDisplay?.label}
        onFeaturedClick={(recipe) => {
          trackEvent("home.featured.click", {
            recipeId: recipe.id,
            slug: recipe.slug,
          });
          navigate(`/receitas/${recipe.slug}`);
        }}
        onViewRelated={() => navigate("/buscar")}
      />
    ),
    premium: settings.showPremiumSection && premiumRecipes.length > 0 && (
      <HomePremium
        premiumRecipes={premiumRecipes}
        theme={theme}
        toggleTheme={toggleTheme}
        premiumRef={premiumRef}
        onExplorePremium={() => {
          trackEvent("home.premium.cta", { source: "premium_section" });
          navigate("/buscar?tier=paid");
        }}
      />
    ),
    gratin: settings.showGratinSection && gratinRecipes.length > 0 && (
      <HomeGratin
        gratinRecipes={gratinRecipes}
        onViewAll={() => navigate("/buscar?category=gratins")}
      />
    ),
    recent: settings.showRecentRecipes && recentRecipes.length > 0 && (
      <HomeRecent
        recentRecipes={recentRecipes}
        onGoAccount={() => navigate("/minha-conta")}
      />
    ),
    about: settings.showAboutSection && (
      <HomeAbout
        settings={settings}
        onLearnMore={() => navigate("/institucional/contato")}
      />
    ),
    newsletter: settings.showNewsletter && <HomeNewsletter />,
  };

  const order = settings.homeSectionsOrder.length
    ? settings.homeSectionsOrder
    : ["hero", "featured", "newsletter"];

  return (
    <div className="flex min-h-screen flex-col">
      <PageHead
        title={settings.siteName}
        description={settings.siteDescription || settings.heroSubtitle}
        canonicalPath="/"
      />
      {order
        .filter((id) => Boolean(sections[id]))
        .map((id) => (
          <div key={id}>{sections[id]}</div>
        ))}
      {isError && (
        <section className="container px-4 py-14">
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed px-6 py-12 text-center">
            <AlertTriangle aria-hidden="true" className="h-8 w-8 text-destructive" />
            <p className="text-muted-foreground">Não foi possível carregar as receitas.</p>
            <button
              onClick={() => void refetch()}
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              Tentar novamente
            </button>
          </div>
        </section>
      )}
      {!loading && !isError && recipes.length === 0 && (
        <section className="container px-4 py-14">
          <div className="rounded-2xl border border-dashed px-6 py-12 text-center text-muted-foreground">
            Nenhuma receita disponível no momento.
          </div>
        </section>
      )}
    </div>
  );
}
