import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search as SearchIcon, Loader2 } from 'lucide-react';
import { PageHead } from '@/components/PageHead';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { listPublicRecipes } from '@/lib/repos/recipeRepo';
import type { RecipeRecord } from '@/lib/recipes/types';
import { useAppContext } from '@/contexts/app-context';
import RecipeCard from '@/components/RecipeCard';
import { trackError, trackEvent } from '@/lib/telemetry';

function normalizeTier(value: string | null) {
  if (value === 'free' || value === 'paid') return value;
  return 'all';
}

function normalizeSort(value: string | null) {
  if (value === 'latest' || value === 'timeAsc' || value === 'timeDesc') return value;
  return 'latest';
}

function normalizeTime(value: string | null) {
  if (value === 'quick' || value === 'medium' || value === 'long') return value;
  return 'all';
}

function readCategoryParam(params: URLSearchParams) {
  return params.get('category') ?? params.get('cat') ?? params.get('categoria');
}

export default function PwaSearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [catFilter, setCatFilter] = useState(readCategoryParam(searchParams) || 'all');
  const [tierFilter, setTierFilter] = useState(normalizeTier(searchParams.get('tier')));
  const [timeFilter, setTimeFilter] = useState(normalizeTime(searchParams.get('tempo')));
  const [sortBy, setSortBy] = useState(normalizeSort(searchParams.get('ordem')));
  const [results, setResults] = useState<RecipeRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const { categories } = useAppContext();

  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    const nextQ = params.get('q') || '';
    const nextCat = readCategoryParam(params) || 'all';
    const nextTier = normalizeTier(params.get('tier'));
    const nextTempo = normalizeTime(params.get('tempo'));
    const nextOrder = normalizeSort(params.get('ordem'));
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
        if (query.trim()) params.set('q', query.trim());
        else params.delete('q');
        if (catFilter !== 'all') {
          params.set('category', catFilter);
        } else {
          params.delete('category');
        }
        params.delete('cat');
        params.delete('categoria');
        if (tierFilter !== 'all') params.set('tier', tierFilter);
        else params.delete('tier');
        if (timeFilter !== 'all') params.set('tempo', timeFilter);
        else params.delete('tempo');
        if (sortBy !== 'latest') params.set('ordem', sortBy);
        else params.delete('ordem');
        return params;
      });
    }, 300);

    return () => window.clearTimeout(handle);
  }, [query, catFilter, tierFilter, timeFilter, sortBy, setSearchParams]);

  useEffect(() => {
    async function fetchResults() {
      setLoading(true);
      try {
        const recipes = await listPublicRecipes({
          q: searchParams.get('q') || undefined,
          categorySlug: readCategoryParam(searchParams) || undefined,
          tier: normalizeTier(searchParams.get('tier')),
          tempo: normalizeTime(searchParams.get('tempo')),
          ordem: normalizeSort(searchParams.get('ordem')),
        });
        setResults(recipes);
      } catch (error) {
        trackError('search.fetch', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }

    void fetchResults();
  }, [searchParams]);

  useEffect(() => {
    trackEvent('search.performed', {
      q: searchParams.get('q') || '',
      categoria: readCategoryParam(searchParams) || 'all',
      category: readCategoryParam(searchParams) || 'all',
      tier: tierFilter,
      tempo: timeFilter,
      ordem: sortBy,
      total: results.length,
    });
  }, [results.length, searchParams, tierFilter, timeFilter, sortBy]);

  return (
    <>
      <PageHead
        title="Buscar Receitas"
        description="Encontre receitas por categoria, tempo de preparo e tipo de acesso."
        canonicalPath="/pwa/app/buscar"
      />
      <div className="w-full">
        {/* Search input */}
        <div className="mb-4 space-y-2">
          <label
            htmlFor="pwa-search-input"
            className="text-xs font-semibold uppercase text-muted-foreground"
          >
            Buscar receitas
          </label>
          <div className="relative">
            <SearchIcon
              aria-hidden="true"
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              id="pwa-search-input"
              placeholder="Nome, ingrediente, tag..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-12 pl-10 text-base"
            />
          </div>
        </div>

        {/* Filters grid - mobile optimized */}
        <div className="mb-4 grid grid-cols-2 gap-2">
          <div>
            <label
              htmlFor="pwa-category-filter"
              className="text-xs font-semibold uppercase text-muted-foreground block mb-1"
            >
              Categoria
            </label>
            <Select value={catFilter} onValueChange={setCatFilter}>
              <SelectTrigger id="pwa-category-filter" className="h-12 text-sm">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.slug} value={c.slug}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label
              htmlFor="pwa-tier-filter"
              className="text-xs font-semibold uppercase text-muted-foreground block mb-1"
            >
              Preço
            </label>
            <Select value={tierFilter} onValueChange={setTierFilter}>
              <SelectTrigger id="pwa-tier-filter" className="h-12 text-sm">
                <SelectValue placeholder="Preço" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="free">Grátis</SelectItem>
                <SelectItem value="paid">Premium</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label
              htmlFor="pwa-time-filter"
              className="text-xs font-semibold uppercase text-muted-foreground block mb-1"
            >
              Tempo
            </label>
            <Select value={timeFilter} onValueChange={setTimeFilter}>
              <SelectTrigger id="pwa-time-filter" className="h-12 text-sm">
                <SelectValue placeholder="Tempo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="quick">Rápido</SelectItem>
                <SelectItem value="medium">Médio</SelectItem>
                <SelectItem value="long">Longo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label
              htmlFor="pwa-sort-filter"
              className="text-xs font-semibold uppercase text-muted-foreground block mb-1"
            >
              Ordenar
            </label>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger id="pwa-sort-filter" className="h-12 text-sm">
                <SelectValue placeholder="Ordenar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="latest">Mais recentes</SelectItem>
                <SelectItem value="timeAsc">Mais rápidas</SelectItem>
                <SelectItem value="timeDesc">Mais lentas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Buscando receitas...</p>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && results.length === 0 && query && (
          <div className="py-12 text-center">
            <p className="text-sm text-muted-foreground">Nenhuma receita encontrada.</p>
          </div>
        )}

        {/* Error state */}
        {!loading && results.length === 0 && !query && (
          <div className="py-12 text-center">
            <p className="text-sm text-muted-foreground">Digite algo para buscar receitas</p>
          </div>
        )}

        {/* Results grid */}
        {!loading && results.length > 0 && (
          <div className="grid grid-cols-1 gap-4">
            {results.map((recipe) => (
              <RecipeCard key={recipe.slug} recipe={recipe} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
