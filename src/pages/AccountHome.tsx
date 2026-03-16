import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Heart, ListChecks, LockOpen, ShoppingCart, UserRound } from "lucide-react";
import { useAppContext } from "@/contexts/app-context";
import { listShoppingList } from "@/lib/api/interactions";
import { listRecipes } from "@/lib/api/recipes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Recipe } from "@/types/recipe";

export default function AccountHome() {
  const { favorites, identityEmail, requireIdentity } = useAppContext();
  const [shoppingCount, setShoppingCount] = useState(0);
  const [unlocked, setUnlocked] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const email = await requireIdentity("Digite seu e-mail para acessar sua conta.");
      if (!email) {
        setLoading(false);
        return;
      }

      try {
        const [shoppingItems, recipes] = await Promise.all([listShoppingList(), listRecipes()]);
        setShoppingCount(shoppingItems.length);
        setUnlocked(recipes.filter((recipe) => recipe.accessTier === "paid" && recipe.isUnlocked).slice(0, 6));
      } catch (error) {
        console.error("Failed to load account data", error);
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [requireIdentity]);

  const stats = useMemo(() => [
    { label: "Favoritos", value: favorites.length, icon: Heart, href: "/minha-conta/favoritos" },
    { label: "Lista de compras", value: shoppingCount, icon: ShoppingCart, href: "/minha-conta/lista-de-compras" },
    { label: "Receitas desbloqueadas", value: unlocked.length, icon: LockOpen, href: "/minha-conta" },
  ], [favorites.length, shoppingCount, unlocked.length]);

  if (loading) {
    return (
      <div className="container px-4 py-16 text-center text-muted-foreground">
        Carregando sua conta...
      </div>
    );
  }

  return (
    <div className="container max-w-6xl space-y-8 px-4 py-10">
      <div className="rounded-3xl border bg-gradient-to-r from-orange-50 via-amber-50 to-background p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Minha Conta</p>
            <h1 className="text-3xl">Seu espaço pessoal no Receitas Bell</h1>
            <p className="text-muted-foreground">
              Acesse favoritos, compras e receitas premium em um só lugar.
            </p>
          </div>
          <div className="rounded-2xl border bg-background px-4 py-3 text-sm">
            <p className="flex items-center gap-2 font-medium">
              <UserRound className="h-4 w-4 text-primary" />
              {identityEmail || "Visitante"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <Link key={stat.label} to={stat.href}>
            <Card className="h-full transition-all hover:-translate-y-0.5 hover:shadow-md">
              <CardHeader className="pb-2">
                <CardDescription>{stat.label}</CardDescription>
                <CardTitle className="text-3xl">{stat.value}</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Ver detalhes</span>
                <stat.icon className="h-4 w-4" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LockOpen className="h-5 w-5 text-primary" />
              Minhas receitas premium
            </CardTitle>
            <CardDescription>Receitas pagas já desbloqueadas para você.</CardDescription>
          </CardHeader>
          <CardContent>
            {unlocked.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {unlocked.map((recipe) => (
                  <Link
                    key={recipe.id}
                    to={`/receitas/${recipe.slug}`}
                    className="rounded-xl border p-3 transition-colors hover:bg-muted/40"
                  >
                    <p className="font-medium">{recipe.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{recipe.totalTime} min • {recipe.servings} porções</p>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
                Você ainda não desbloqueou receitas premium.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListChecks className="h-5 w-5 text-primary" />
              Atalhos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link to="/minha-conta/favoritos"><Button variant="outline" className="w-full justify-start">Ver favoritos</Button></Link>
            <Link to="/minha-conta/lista-de-compras"><Button variant="outline" className="w-full justify-start">Abrir lista de compras</Button></Link>
            <Link to="/buscar"><Button className="w-full justify-start">Descobrir novas receitas</Button></Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
