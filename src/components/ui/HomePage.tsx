import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { Recipe } from "@/entities/recipe/model/types";
import { recipeRepository } from "@/entities/recipe/api/repository";
import { RecipeCard } from "@/entities/recipe/ui/RecipeCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { NewsletterForm } from "@/features/newsletter/ui/NewsletterForm";

export default function HomePage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [recentRecipes, setRecentRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    async function loadRecipes() {
      try {
        const data = await recipeRepository.getAll();
        // Filtra apenas receitas publicadas
        const published = data.filter(r => r.status === 'published');
        setRecipes(published);

        // Carrega histórico
        try {
          const historyIds = JSON.parse(localStorage.getItem("receitas_bell_recent_recipes") || "[]");
          if (Array.isArray(historyIds) && historyIds.length > 0) {
            // Mapeia os IDs para objetos de receita, mantendo a ordem do histórico (mais recente primo)
            const recent = historyIds
              .map((id: string) => published.find(r => r.id === id))
              .filter((r): r is Recipe => !!r);
            setRecentRecipes(recent);
          }
        } catch (e) {
          console.error("Failed to load history", e);
        }
      } catch (error) {
        console.error("Failed to load recipes", error);
      } finally {
        setLoading(false);
      }
    }
    loadRecipes();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/buscar?q=${encodeURIComponent(searchTerm)}`);
    }
  };

  return (
    <div className="flex flex-col min-h-screen font-sans">
      {/* Hero Section */}
      <section className="bg-orange-50 dark:bg-orange-950/20 py-16 md:py-24">
        <div className="container px-4 md:px-6 text-center space-y-6">
          <h1 className="font-serif text-4xl md:text-6xl font-bold tracking-tighter text-orange-900 dark:text-orange-100">
            Receitas do Bell
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-[700px] mx-auto font-sans">
            Descubra receitas deliciosas, testadas e aprovadas para tornar seus momentos na cozinha inesquecíveis.
          </p>
          
          <div className="max-w-md mx-auto w-full">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar receitas..."
                  className="pl-9 bg-background font-sans"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button type="submit" className="font-sans">Buscar</Button>
            </form>
          </div>
        </div>
      </section>

      {/* Featured Recipes */}
      <section className="container px-4 md:px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-serif text-2xl font-bold tracking-tight">Destaques da Semana</h2>
          <Button variant="link" onClick={() => navigate('/buscar')} className="font-sans">
            Ver todas
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-[200px] w-full rounded-xl" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {recipes.length > 0 ? (
              recipes.map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))
            ) : (
              <div className="col-span-full text-center py-12 text-muted-foreground font-sans">
                Nenhuma receita encontrada.
              </div>
            )}
          </div>
        )}
      </section>

      {/* Recent Recipes Section */}
      {recentRecipes.length > 0 && (
        <section className="container px-4 md:px-6 py-12 border-t">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-serif text-2xl font-bold tracking-tight">Visto Recentemente</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {recentRecipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        </section>
      )}

      {/* Newsletter Section */}
      <section className="border-t bg-muted/30 py-16">
        <div className="container flex flex-col items-center text-center space-y-4">
          <h2 className="font-serif text-3xl font-bold tracking-tight">Fique por dentro das novidades</h2>
          <p className="text-muted-foreground max-w-[600px] font-sans">
            Inscreva-se em nossa newsletter para receber receitas semanais, dicas de culinária e ofertas especiais.
          </p>
          <div className="w-full max-w-sm pt-4">
            <NewsletterForm />
          </div>
        </div>
      </section>
    </div>
  );
}