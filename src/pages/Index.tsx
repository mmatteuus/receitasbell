
function isGratinRecipe(recipe: Recipe) {
  const normalizedCategory = recipe.categorySlug?.toLowerCase();
  const tagMatch = recipe.tags?.some((tag) => tag.toLowerCase().includes("gratin"));
  return normalizedCategory === "gratins" || tagMatch;
}
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Search, Sparkles, Sun, Moon } from "lucide-react";
import { NewsletterSignup } from "@/components/NewsletterSignup";
import { Reveal } from "@/components/motion/Reveal";
import RecipeCard from "@/components/RecipeCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import SmartImage from "@/components/SmartImage";
import { useAppContext } from "@/contexts/app-context";
import { listRecipes } from "@/lib/api/recipes";
import { pickFeaturedRecipes, pickPremiumRecipes } from "@/lib/home/curation";
import { getRecipeImage, getRecipePresentation } from "@/lib/recipes/presentation";
import { resolveCategoryDisplay } from "@/lib/categoriesDisplay";
import { trackError, trackEvent } from "@/lib/telemetry";
import { BackToTop } from "@/components/BackToTop";
import type { Recipe } from "@/types/recipe";

const RECENT_RECIPES_KEY = "receitas_bell_recent_recipes";

export default function HomePage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [recentRecipes, setRecentRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const { categories, settings } = useAppContext();
  const premiumRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadRecipes() {
      try {
        const published = await listRecipes();
        setRecipes(published);

        try {
          const historyIds = JSON.parse(localStorage.getItem(RECENT_RECIPES_KEY) || "[]");
          if (Array.isArray(historyIds) && historyIds.length > 0) {
            const recent = historyIds
              .map((id: string) => published.find((recipe) => recipe.id === id))
              .filter((recipe): recipe is Recipe => Boolean(recipe));
            setRecentRecipes(recent);
          }
        } catch (error) {
          console.error("Failed to load history", error);
        }
      } catch (error) {
        trackError("home.loadRecipes", error);
      } finally {
        setLoading(false);
      }
    }

    void loadRecipes();
  }, []);

  const featuredRecipes = useMemo(() => pickFeaturedRecipes(recipes, settings), [recipes, settings]);
  const featuredMainRecipe = featuredRecipes[0] ?? null;
  const featuredMainPresentation = featuredMainRecipe ? getRecipePresentation(featuredMainRecipe) : null;
  const premiumRecipes = useMemo(() => pickPremiumRecipes(recipes, featuredRecipes, 4), [featuredRecipes, recipes]);

  const gratinRecipes = useMemo(() => recipes.filter(isGratinRecipe), [recipes]);

  const featuredCategoryDisplay = featuredMainRecipe
    ? resolveCategoryDisplay(categories, featuredMainRecipe.categorySlug)
    : null;

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    if (!searchTerm.trim()) return;
    trackEvent("home.search.submit", { q: searchTerm.trim() });
    navigate(`/buscar?q=${encodeURIComponent(searchTerm)}`);
  };

  const sections = {
    hero: (
      <section key="hero" className="relative overflow-hidden border-b bg-gradient-to-b from-orange-50 via-amber-50/70 to-background py-10 sm:py-14 lg:py-20">
        <div className="pointer-events-none absolute -top-24 right-[-140px] h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
        <div className="container relative grid items-center gap-10 px-4 lg:grid-cols-[1.05fr_0.95fr]">
          <Reveal>
            <div className="space-y-6">
              {settings.heroBadge && (
                <Badge variant="outline" className="rounded-full border-primary/30 bg-background/80 px-4 py-1 text-xs">
                  {settings.heroBadge}
                </Badge>
              )}
              <h1 data-testid="home-hero-heading" className="max-w-[18ch] text-4xl leading-tight sm:text-5xl lg:text-6xl">{settings.heroTitle}</h1>
              <p className="max-w-[58ch] text-base text-muted-foreground sm:text-lg">{settings.heroSubtitle}</p>
              <div className="flex flex-wrap gap-3">
                <Button
                  size="lg"
                  className="gap-2 shadow-sm transition-transform hover:-translate-y-0.5"
                  onClick={() => navigate(settings.heroPrimaryCtaHref || "/buscar")}
                >
                  {settings.heroPrimaryCtaLabel}
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="transition-transform hover:-translate-y-0.5"
                  onClick={() => navigate(settings.heroSecondaryCtaHref || "/buscar")}
                >
                  {settings.heroSecondaryCtaLabel}
                </Button>
              </div>
              <form onSubmit={handleSearch} className="mt-2 flex max-w-xl gap-2">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Busque por prato, ingrediente ou ocasião"
                  data-testid="home-search-input"
                  className="h-11 rounded-xl pl-9"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
                </div>
                <Button type="submit" className="h-11 rounded-xl">Buscar</Button>
              </form>
            </div>
          </Reveal>
          <Reveal delayMs={120}>
            <div className="relative">
              <SmartImage
                src={settings.heroImageUrl}
                alt={settings.siteName}
                priority
                className="h-[340px] w-full rounded-3xl object-cover shadow-2xl sm:h-[420px]"
                data-testid="home-hero-visual"
              />
              <div className="absolute bottom-5 left-5 rounded-2xl border border-white/30 bg-black/35 px-4 py-3 text-white backdrop-blur">
                <p className="text-xs uppercase tracking-[0.2em] text-white/80">Selecao da Casa</p>
                <p className="font-heading text-xl">Receitas para impressionar sem complicar</p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    ),
    trustBar: settings.showTrustBar && settings.trustBarItems.length > 0 && (
      <section key="trustBar" className="border-b bg-background/80">
        <div className="container grid gap-3 px-4 py-6 sm:grid-cols-2 lg:grid-cols-4">
          {settings.trustBarItems.slice(0, 4).map((item, index) => (
            <Reveal key={item} delayMs={index * 40}>
              <div className="rounded-xl border bg-card px-4 py-3 text-sm text-muted-foreground">{item}</div>
            </Reveal>
          ))}
        </div>
      </section>
    ),
    categories: settings.showCategoriesGrid && (
      <section key="categories" className="container px-4 py-12">
        <Reveal>
          <div className="mb-7 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Descubra por tema</p>
              <h2 className="text-3xl">Coleções por categoria</h2>
            </div>
            <Button variant="link" onClick={() => navigate("/buscar")} className="px-0">Ver catálogo completo</Button>
          </div>
        </Reveal>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category, index) => (
            <Reveal key={category.slug} delayMs={index * 35}>
              <Link
                to={`/categorias/${category.slug}`}
                className="group block rounded-2xl border bg-card p-5 transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-xl">{category.emoji}</div>
                <h3 className="text-xl">{category.name}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{category.description}</p>
                <p className="mt-4 text-sm font-medium text-primary">Explorar categoria</p>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>
    ),
    featured: settings.showFeaturedRecipes && (
      <section key="featured" className="container px-4 py-12">
        <Reveal>
          <div className="mb-7 space-y-2">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Curadoria editorial</p>
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
        ) : featuredRecipes.length > 0 ? (
          <div className="grid gap-6 lg:grid-cols-12">
            <Reveal className="lg:col-span-7">
              <article className="overflow-hidden rounded-3xl border bg-card shadow-sm">
                <Link to={`/receitas/${featuredMainRecipe!.slug}`} className="block">
                <SmartImage
                  src={getRecipeImage(featuredMainRecipe!)}
                  alt={featuredMainRecipe!.title}
                  className="h-[320px] w-full object-cover"
                />
                </Link>
                <div className="space-y-3 p-6">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline" className="capitalize">
                      {featuredCategoryDisplay ? `${featuredCategoryDisplay.emoji} ${featuredCategoryDisplay.label}` : featuredMainRecipe!.categorySlug}
                    </Badge>
                    <span>{featuredMainRecipe!.totalTime} min</span>
                  </div>
                  <h3 className="text-3xl leading-tight">{featuredMainPresentation?.cardTitle || featuredMainRecipe!.title}</h3>
                  <p className="text-muted-foreground">{featuredMainPresentation?.marketingHeadline || featuredMainRecipe!.description}</p>
                  <Button
                    onClick={() => {
                      trackEvent("home.featured.click", { recipeId: featuredMainRecipe!.id, slug: featuredMainRecipe!.slug });
                      navigate(`/receitas/${featuredMainRecipe!.slug}`);
                    }}
                    className="gap-2"
                  >
                    Ver receita
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </article>
            </Reveal>
            <div className="grid gap-5 sm:grid-cols-2 lg:col-span-5 lg:grid-cols-1">
              {featuredRecipes.slice(1, 5).map((recipe, index) => (
                <Reveal key={recipe.id} delayMs={index * 60}>
                  <RecipeCard recipe={recipe} />
                </Reveal>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed px-6 py-14 text-center text-muted-foreground">
            Nenhuma receita disponível para a curadoria selecionada.
          </div>
        )}
      </section>
    ),
    premium: settings.showPremiumSection && premiumRecipes.length > 0 && (
      <section key="premium" className="border-y bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 py-12 text-zinc-100">
        <div className="container px-4">
          <Reveal>
            <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-300">Coleção exclusiva</p>
                <h2 className="text-3xl">Receitas Premium para momentos especiais</h2>
                <p className="max-w-2xl text-sm text-zinc-300">
                  Conteúdos completos, combinações autorais e preparo guiado para quem quer ir além do básico.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleTheme}
                  title="Alternar tema"
                  className="border border-white/20 text-white/80 hover:text-white"
                >
                  {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    trackEvent("home.premium.cta", { source: "premium_section" });
                    navigate("/buscar?tier=paid");
                  }}
                  className="gap-2"
                >
                  Explorar premium
                  <Sparkles className="h-4 w-4" />
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-sm text-zinc-200"
                    onClick={() => premiumRef.current?.scrollBy({ left: -360, behavior: "smooth" })}
                  >
                    ←
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-sm text-zinc-200"
                    onClick={() => premiumRef.current?.scrollBy({ left: 360, behavior: "smooth" })}
                  >
                    →
                  </Button>
                </div>
              </div>
            </div>
          </Reveal>
          <div
            ref={premiumRef}
            className="hide-scrollbar flex gap-5 overflow-x-auto pb-4 scroll-smooth snap-x snap-mandatory"
          >
            {premiumRecipes.map((recipe, index) => (
              <Reveal key={recipe.id} delayMs={index * 50}>
                <div className="snap-start min-w-[260px] flex-1 md:min-w-[320px]">
                  <RecipeCard recipe={recipe} />
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    ),
    recent: settings.showRecentRecipes && recentRecipes.length > 0 && (
      <section key="recent" className="container px-4 py-12">
        <Reveal>
          <div className="mb-7 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Seu histórico</p>
              <h2 className="text-3xl">Continue de onde parou</h2>
            </div>
            <Button variant="link" onClick={() => navigate("/minha-conta")} className="px-0">Ir para Minha Conta</Button>
          </div>
        </Reveal>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {recentRecipes.map((recipe, index) => (
            <Reveal key={recipe.id} delayMs={index * 40}>
              <RecipeCard recipe={recipe} />
            </Reveal>
          ))}
        </div>
      </section>
    ),
    about: settings.showAboutSection && (
      <section key="about" className="container px-4 py-12">
        <Reveal>
          <div className="grid items-center gap-7 rounded-3xl border bg-card p-6 sm:p-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-4">
              <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs">Sobre a marca</Badge>
              <h2 className="text-3xl">{settings.aboutHeadline}</h2>
              <p className="text-muted-foreground">{settings.aboutText}</p>
              <Button variant="outline" onClick={() => navigate("/institucional/contato")} className="gap-2">
                Conhecer mais
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
            <SmartImage
              src={settings.aboutImageUrl}
              alt={settings.siteName}
              className="h-[260px] w-full rounded-2xl object-cover sm:h-[320px]"
            />
          </div>
        </Reveal>
      </section>
    ),
    newsletter: settings.showNewsletter && (
      <section key="newsletter" className="border-t bg-muted/40 py-14">
        <div className="container px-4">
          <Reveal>
            <div className="rounded-3xl border bg-card p-8 text-center sm:p-10">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Newsletter semanal</p>
              <h2 className="mt-3 text-3xl">Receba cardápios, técnicas e novidades da semana</h2>
              <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
                Uma seleção prática para facilitar o planejamento das refeições e descobrir novas receitas com curadoria.
              </p>
              <div className="mt-6 flex justify-center">
                <NewsletterSignup />
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    ),
  };

  const order = settings.homeSectionsOrder.length ? settings.homeSectionsOrder : ["hero", "featured", "newsletter"];

  return (
    <div className="flex min-h-screen flex-col">
      {order.map((sectionId) => sections[sectionId]).filter(Boolean)}
      {!loading && recipes.length === 0 && (
        <section className="container px-4 py-14">
          <div className="rounded-2xl border border-dashed px-6 py-12 text-center text-muted-foreground">
            Nenhuma receita disponível no momento.
          </div>
        </section>
      )}
      <BackToTop />
    </div>
  );
}
