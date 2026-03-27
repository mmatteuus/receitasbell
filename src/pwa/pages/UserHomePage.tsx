import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Search, Heart, ListChecks, ShoppingBag, 
  Sparkles, Clock, ChevronRight, UserCircle2,
  ChefHat, GraduationCap
} from "lucide-react";
import { useAppContext } from "@/contexts/app-context";
import { usePublicRecipes } from "@/features/recipes/use-recipes";
import { RECENT_RECIPES_KEY } from "@/lib/constants";
import type { RecipeRecord } from "@/lib/recipes/types";
import { getRecipeImage, getRecipePresentation } from "@/lib/recipes/presentation";
import SmartImage from "@/components/SmartImage";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function UserHomePage() {
  const { identityEmail, favoriteRecords } = useAppContext();
  const { data: recipes = [], isLoading } = usePublicRecipes();
  const navigate = useNavigate();

  const recentRecipes = useMemo(() => {
    try {
      const historyIds = JSON.parse(localStorage.getItem(RECENT_RECIPES_KEY) || "[]");
      if (!Array.isArray(historyIds) || historyIds.length === 0) return [];
      return historyIds
        .map((id: string) => recipes.find((recipe) => recipe.id === id))
        .filter((recipe): recipe is RecipeRecord => Boolean(recipe))
        .slice(0, 4);
    } catch {
      return [];
    }
  }, [recipes]);

  const featuredRecipes = useMemo(() => {
    return recipes.filter(r => r.accessTier === 'paid').slice(0, 5);
  }, [recipes]);

  const quickLinks = [
    { label: "Buscar", icon: Search, to: "/buscar", color: "bg-blue-500/10 text-blue-600" },
    { label: "Favoritos", icon: Heart, to: "/pwa/app/favoritos", color: "bg-red-500/10 text-red-600" },
    { label: "Compras", icon: ShoppingBag, to: "/pwa/app/compras", color: "bg-green-500/10 text-green-600" },
    { label: "Minha Lista", icon: ListChecks, to: "/pwa/app/lista-de-compras", color: "bg-orange-500/10 text-orange-600" },
  ];

  return (
    <div className="space-y-8 pb-8 animate-in fade-in duration-500">
      {/* Welcome Header */}
      <section className="flex flex-col gap-1 px-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Bem-vindo(a)</p>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight truncate max-w-[240px]">
            {identityEmail?.split('@')[0] || "Usuário"}
          </h1>
          <div className="h-10 w-10 rounded-full border bg-muted flex items-center justify-center">
             <UserCircle2 className="h-6 w-6 text-muted-foreground" />
          </div>
        </div>
      </section>

      {/* Quick Actions Grid */}
      <section className="grid grid-cols-2 gap-3">
        {quickLinks.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className="flex flex-col items-center justify-center gap-3 p-4 rounded-2xl border bg-card/50 transition-active hover:bg-card active:scale-95 shadow-sm"
          >
            <div className={`p-3 rounded-xl ${link.color}`}>
              <link.icon className="h-6 w-6" />
            </div>
            <span className="text-sm font-medium">{link.label}</span>
          </Link>
        ))}
      </section>

      {/* Continue Reading / Recents */}
      {recentRecipes.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <h2 className="text-lg font-bold tracking-tight">Continuar lendo</h2>
            </div>
          </div>
          <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2 snap-x px-1">
            {recentRecipes.map((recipe) => (
              <Link 
                key={recipe.id}
                to={`/receitas/${recipe.slug}`}
                className="flex-shrink-0 w-64 snap-start group"
              >
                <div className="relative h-36 w-full overflow-hidden rounded-2xl border bg-muted mb-2">
                  <SmartImage
                    src={getRecipeImage(recipe)}
                    alt={recipe.title}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                  {recipe.accessTier === 'paid' && (
                    <div className="absolute top-2 right-2 p-1.5 rounded-full bg-black/40 backdrop-blur text-white shadow-xl border border-white/20">
                      <Sparkles className="h-3 w-3 fill-amber-400 text-amber-400" />
                    </div>
                  )}
                </div>
                <h3 className="font-bold text-sm leading-tight text-foreground line-clamp-2">
                  {getRecipePresentation(recipe).cardTitle}
                </h3>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured / Premium Carousel */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <h2 className="text-lg font-bold tracking-tight">Seleção Premium</h2>
          </div>
          <Link to="/buscar?tier=paid" className="text-xs font-semibold text-primary flex items-center gap-0.5">
            Ver tudo <ChevronRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2 snap-x px-1">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="flex-shrink-0 h-48 w-40 rounded-2xl" />
            ))
          ) : featuredRecipes.map((recipe) => (
            <Link 
              key={recipe.id}
              to={`/receitas/${recipe.slug}`}
              className="flex-shrink-0 w-40 snap-start group"
            >
              <div className="relative h-48 w-full overflow-hidden rounded-2xl bg-muted shadow-lg border border-border">
                <SmartImage
                  src={getRecipeImage(recipe)}
                  alt={recipe.title}
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 p-3 w-full">
                  <p className="text-white text-xs font-bold leading-tight mb-1 line-clamp-2">
                    {getRecipePresentation(recipe).cardTitle}
                  </p>
                  <div className="flex items-center gap-1.5 text-[10px] text-zinc-300">
                    <Clock className="h-2.5 w-2.5" />
                    <span>{recipe.totalTime}m</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Tips / Learning Section (Mocked for premium feel) */}
      <section className="bg-gradient-to-br from-primary/10 to-amber-500/10 rounded-3xl p-6 border border-primary/20">
         <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-primary text-primary-foreground">
               <GraduationCap className="h-6 w-6" />
            </div>
            <div>
               <h2 className="text-lg font-bold leading-tight">Mestre Cuca Bell</h2>
               <p className="text-xs text-muted-foreground">Aprenda novas técnicas</p>
            </div>
         </div>
         <div className="space-y-3">
            <div className="p-3 rounded-xl bg-background/60 border border-white/50 text-sm font-medium active:scale-95 transition-active flex items-center justify-between">
               <span>Dica: Como gratinar perfeitamente</span>
               <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="p-3 rounded-xl bg-background/60 border border-white/50 text-sm font-medium active:scale-95 transition-active flex items-center justify-between">
               <span>Técnica: Cortes básicos de legumes</span>
               <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
         </div>
      </section>
    </div>
  );
}
