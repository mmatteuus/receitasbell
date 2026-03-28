import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search as SearchIcon } from "lucide-react";
import { PageHead } from "@/components/PageHead";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { listPublicRecipes } from "@/lib/repos/recipeRepo";
import type { RecipeRecord } from "@/lib/recipes/types";
import { useAppContext } from "@/contexts/app-context";
import RecipeCard from "@/components/RecipeCard";
import { trackError, trackEvent } from "@/lib/telemetry";

function normalizeTier(value: string | null) {
  if (value === "free" || value === "paid") return value;
  return "all";
}

function normalizeSort(value: string | null) {
  if (value === "latest" || value === "timeAsc" || value === "timeDesc") return value;
  return "latest";
}

function normalizeTime(value: string | null) {
  if (value === "quick" || value === "medium" || value === "long") return value;
  return "all";
}

function readCategoryParam(params: URLSearchParams) {
  return params.get("category") ?? params.get("cat") ?? params.get("categoria");
}

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [catFilter, setCatFilter] = useState(readCategoryParam(searchParams) || "all");
  const [tierFilter, setTierFilter] = useState(normalizeTier(searchParams.get("tier")));
  const [timeFilter, setTimeFilter] = useState(normalizeTime(searchParams.get("tempo")));
  const [sortBy, setSortBy] = useState(normalizeSort(searchParams.get("ordem")));
  const [results, setResults] = useState<RecipeRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const { categories } = useAppContext();

  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    const nextQ = params.get("q") || "";
    const nextCat = readCategoryParam(params) || "all";
    const nextTier = normalizeTier(params.get("tier"));
    const nextTempo = normalizeTime(params.get("tempo"));
    const nextOrder = normalizeSort(params.get("ordem"));
    setQuery(nextQ);
    setCatFilter(nextCat);
    setTierFilter(nextTier);
    setTimeFilter(nextTempo);
    setSortBy(nextOrder);
  }, [searchParams]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setSearchParams((current) => {
        const params = new URLSearchParams(current);
        if (query.trim()) params.set("q", query.trim());
        else params.delete("q");
        if (catFilter !== "all") {
          params.set("category", catFilter);
        } else {
          params.delete("category");
        }
        params.delete("cat");
        params.delete("categoria");
        if (tierFilter !== "all") params.set("tier", tierFilter);
        else params.delete("tier");
        if (timeFilter !== "all") params.set("tempo", timeFilter);
        else params.delete("tempo");
        if (sortBy !== "latest") params.set("ordem", sortBy);
        else params.delete("ordem");
        return params;
      }, { replace: true });
    }, 300);

    return () => window.clearTimeout(handle);
  }, [query, catFilter, tierFilter, timeFilter, sortBy, setSearchParams]);

  useEffect(() => {
    async function fetchResults() {
      setLoading(true);
      try {
        const recipes = await listPublicRecipes({
          q: searchParams.get("q") || undefined,
          categorySlug: readCategoryParam(searchParams) || undefined,
        });
        setResults(recipes);
      } catch (error) {
        trackError("search.fetch", error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }

    void fetchResults();
  }, [searchParams]);

  const filtered = useMemo(() => {
    const next = results.filter((recipe) => {
      const tierMatch = tierFilter === "all" || recipe.accessTier === tierFilter;
      if (!tierMatch) return false;

      if (timeFilter === "quick") return recipe.totalTime <= 30;
      if (timeFilter === "medium") return recipe.totalTime > 30 && recipe.totalTime <= 60;
      if (timeFilter === "long") return recipe.totalTime > 60;
      return true;
    });

    if (sortBy === "timeAsc") {
      return [...next].sort((a, b) => a.totalTime - b.totalTime);
    }
    if (sortBy === "timeDesc") {
      return [...next].sort((a, b) => b.totalTime - a.totalTime);
    }
    return [...next].sort((a, b) => (b.publishedAt || b.updatedAt || "").localeCompare(a.publishedAt || a.updatedAt || ""));
  }, [results, tierFilter, timeFilter, sortBy]);

  useEffect(() => {
    trackEvent("search.performed", {
      q: searchParams.get("q") || "",
      categoria: readCategoryParam(searchParams) || "all",
      category: readCategoryParam(searchParams) || "all",
      tier: tierFilter,
      tempo: timeFilter,
      ordem: sortBy,
      total: filtered.length,
    });
  }, [filtered.length, searchParams, tierFilter, timeFilter, sortBy]);

  return (
    <div className="container px-4 py-8 sm:py-10">
      <PageHead
        title="Buscar Receitas"
        description="Encontre receitas por categoria, tempo de preparo e tipo de acesso."
        canonicalPath="/buscar"
      />
      <h1 className="font-heading text-2xl font-bold sm:text-3xl">Buscar Receitas</h1>
      <p className="mt-1 text-sm text-muted-foreground">Refine por categoria, tempo e tipo de acesso.</p>
      <div className="mt-4 grid gap-3 sm:mt-6 sm:grid-cols-2 lg:grid-cols-5">
        <div className="relative sm:col-span-2 lg:col-span-2">
          <label htmlFor="search-page-input" className="sr-only">Buscar receitas</label>
          <SearchIcon aria-hidden="true" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="search-page-input"
            placeholder="Buscar por nome, ingrediente ou tag..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger><SelectValue placeholder="Categoria" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {categories.map((c) => <SelectItem key={c.slug} value={c.slug}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={tierFilter} onValueChange={setTierFilter}>
          <SelectTrigger><SelectValue placeholder="Preço" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="free">Grátis</SelectItem>
            <SelectItem value="paid">Pago</SelectItem>
          </SelectContent>
        </Select>
        <Select value={timeFilter} onValueChange={setTimeFilter}>
          <SelectTrigger><SelectValue placeholder="Tempo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Qualquer tempo</SelectItem>
            <SelectItem value="quick">Até 30 min</SelectItem>
            <SelectItem value="medium">31 a 60 min</SelectItem>
            <SelectItem value="long">Mais de 60 min</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="mt-3 w-full sm:w-56">
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger><SelectValue placeholder="Ordenar por" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="latest">Mais recentes</SelectItem>
            <SelectItem value="timeAsc">Tempo: menor primeiro</SelectItem>
            <SelectItem value="timeDesc">Tempo: maior primeiro</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <p data-testid="search-results-count" className="mt-4 text-sm text-muted-foreground">
        {loading ? "Atualizando resultados..." : `${filtered.length} resultado${filtered.length !== 1 ? "s" : ""}`}
      </p>
      {filtered.length > 0 ? (
        <div className="mt-4 grid gap-4 sm:mt-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((recipe) => <RecipeCard key={recipe.id} recipe={recipe} />)}
        </div>
      ) : (
        <p className="mt-10 rounded-xl border border-dashed px-4 py-10 text-center text-muted-foreground">
          Nenhuma receita encontrada com os filtros atuais.
        </p>
      )}
    </div>
  );
}
