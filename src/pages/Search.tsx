import { useState, useMemo } from "react";
import { Search as SearchIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getPublishedRecipes } from "@/lib/storage";
import { categories } from "@/lib/categories";
import RecipeCard from "@/components/RecipeCard";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [tierFilter, setTierFilter] = useState("all");
  const published = getPublishedRecipes();

  const results = useMemo(() => {
    const q = query.toLowerCase();
    return published.filter((r) => {
      const matchText = !q || r.title.toLowerCase().includes(q) || r.description.toLowerCase().includes(q) || r.tags.some((t) => t.toLowerCase().includes(q));
      const matchCat = catFilter === "all" || r.categorySlug === catFilter;
      const matchTier = tierFilter === "all" || r.accessTier === tierFilter;
      return matchText && matchCat && matchTier;
    });
  }, [query, catFilter, tierFilter, published]);

  return (
    <div className="container py-10">
      <h1 className="font-heading text-3xl font-bold">Buscar Receitas</h1>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar por nome, ingrediente ou tag..." value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
        </div>
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.slug} value={c.slug}>{c.emoji} {c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={tierFilter} onValueChange={setTierFilter}>
          <SelectTrigger className="w-full sm:w-32">
            <SelectValue placeholder="Preço" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="free">Grátis</SelectItem>
            <SelectItem value="paid">Pago</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <p className="mt-4 text-sm text-muted-foreground">{results.length} resultado{results.length !== 1 && "s"}</p>
      {results.length > 0 ? (
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((r) => <RecipeCard key={r.id} recipe={r} />)}
        </div>
      ) : (
        <p className="mt-10 text-center text-muted-foreground">Nenhuma receita encontrada.</p>
      )}
    </div>
  );
}
