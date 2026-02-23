import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getPublishedRecipes } from "@/lib/storage";
import { categories } from "@/lib/categories";
import RecipeCard from "@/components/RecipeCard";
import CategoryCard from "@/components/CategoryCard";
import heroImage from "@/assets/hero-food.jpg";

export default function Index() {
  const published = getPublishedRecipes();
  const recent = [...published].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 6);

  return (
    <>
      {/* Hero */}
      <section className="relative flex min-h-[480px] items-center justify-center overflow-hidden">
        <img src={heroImage} alt="Mesa com pratos" className="absolute inset-0 h-full w-full object-cover" />
        <div className="hero-overlay absolute inset-0" />
        <div className="relative z-10 mx-auto max-w-2xl px-4 py-20 text-center animate-fade-in">
          <h1 className="font-heading text-4xl font-bold tracking-tight text-white md:text-5xl lg:text-6xl">
            Receitas do Bell
          </h1>
          <p className="mt-4 text-lg text-white/90 md:text-xl">
            Receitas caseiras testadas e aprovadas para você fazer em casa com carinho.
          </p>
          <Link to="/buscar" className="mt-8 inline-block">
            <Button size="lg" className="gap-2 text-base">
              <Search className="h-4 w-4" />
              Buscar receita
            </Button>
          </Link>
        </div>
      </section>

      {/* Categories */}
      <section className="container py-16">
        <h2 className="text-center font-heading text-3xl font-bold">Categorias</h2>
        <p className="mt-2 text-center text-muted-foreground">Explore por tipo de receita</p>
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map((cat) => {
            const count = published.filter((r) => r.categorySlug === cat.slug).length;
            return <CategoryCard key={cat.slug} category={cat} count={count} />;
          })}
        </div>
      </section>

      {/* Recent */}
      <section className="container pb-16">
        <h2 className="font-heading text-3xl font-bold">Chegou agora</h2>
        <p className="mt-1 text-muted-foreground">As receitas mais recentes</p>
        {recent.length === 0 ? (
          <div className="mt-8 rounded-xl border bg-card p-10 text-center">
            <p className="text-muted-foreground">Nenhuma receita publicada ainda.</p>
            <Link to="/admin" className="mt-4 inline-block">
              <Button variant="outline">Ir para o Admin</Button>
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {recent.map((r) => (
              <RecipeCard key={r.id} recipe={r} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
