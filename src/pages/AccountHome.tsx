import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Heart, ListChecks, LockOpen, ShoppingCart, UserRound, WalletCards } from "lucide-react";
import { useAppContext } from "@/contexts/app-context";
import { listShoppingList } from "@/lib/api/interactions";
import { listRecipes } from "@/lib/api/recipes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getRecipeImage, getRecipePresentation } from "@/lib/recipes/presentation";
import SmartImage from "@/components/SmartImage";
import type { Recipe } from "@/types/recipe";
import { ApiClientError } from "@/lib/api/client";
import { toast } from "sonner";

type AccountTab = "resumo" | "minhas-receitas" | "favoritos" | "compras";

function resolveTab(value: string | null): AccountTab {
  if (value === "minhas-receitas" || value === "favoritos" || value === "compras") {
    return value;
  }
  return "resumo";
}

export default function AccountHome() {
  const { favorites, favoriteRecords, identityEmail, requireIdentity, updateIdentity, clearIdentity } = useAppContext();
  const [params, setParams] = useSearchParams();
  const [currentTab, setCurrentTab] = useState<AccountTab>(() => resolveTab(params.get("tab")));
  const [identityInput, setIdentityInput] = useState(identityEmail || "");
  const [savingIdentity, setSavingIdentity] = useState(false);
  const [shoppingCount, setShoppingCount] = useState(0);
  const [shoppingPreview, setShoppingPreview] = useState<string[]>([]);
  const [unlocked, setUnlocked] = useState<Recipe[]>([]);
  const [paidOwned, setPaidOwned] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setIdentityInput(identityEmail || "");
  }, [identityEmail]);

  useEffect(() => {
    setCurrentTab(resolveTab(params.get("tab")));
  }, [params]);

  useEffect(() => {
    if (!identityEmail) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);

    async function load() {
      try {
        const [shoppingItems, recipes] = await Promise.all([listShoppingList(), listRecipes()]);
        if (!isMounted) return;
        setShoppingCount(shoppingItems.length);
        setShoppingPreview(shoppingItems.slice(0, 6).map((item) => item.text));
        const unlockedPaid = recipes.filter((recipe) => recipe.accessTier === "paid" && recipe.isUnlocked);
        setUnlocked(unlockedPaid);
        setPaidOwned(unlockedPaid);
      } catch (error) {
        console.error("Failed to load account data", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      isMounted = false;
    };
  }, [identityEmail]);

  const stats = useMemo(() => [
    { label: "Favoritos", value: favorites.length, icon: Heart, tab: "favoritos" as AccountTab },
    { label: "Lista de compras", value: shoppingCount, icon: ShoppingCart, tab: "resumo" as AccountTab },
    { label: "Receitas desbloqueadas", value: unlocked.length, icon: LockOpen, tab: "minhas-receitas" as AccountTab },
  ], [favorites.length, shoppingCount, unlocked.length]);

  function changeTab(tab: AccountTab) {
    setCurrentTab(tab);
    setParams((current) => {
      const next = new URLSearchParams(current);
      next.set("tab", tab);
      return next;
    }, { replace: true });
  }

  async function handleSaveIdentity() {
    setSavingIdentity(true);
    try {
      await updateIdentity(identityInput);
      toast.success("Identidade atualizada");
    } catch (error) {
      if (error instanceof ApiClientError) {
        toast.error(error.message);
      } else {
        toast.error("Não foi possível atualizar o e-mail.");
      }
    } finally {
      setSavingIdentity(false);
    }
  }

  function handleClearIdentity() {
    clearIdentity();
    toast.success("Sessão de identidade removida neste dispositivo.");
  }

  if (!identityEmail) {
    return (
      <div className="container flex flex-col items-center justify-center space-y-6 px-4 py-10 text-center">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Minha Conta</p>
          <h1 className="text-3xl font-semibold">Para acessar sua conta é preciso estar logado</h1>
          <p className="text-muted-foreground">
            Faça seu cadastro com e-mail para salvar favoritos, comprar receitas e acessar coleções exclusivas.
          </p>
        </div>
        <Button onClick={() => void requireIdentity("Informe seu e-mail para liberar o acesso à Minha Conta")}>
          Cadastrar / Entrar
        </Button>
      </div>
    );
  }

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
              Gerencie sua identidade, acompanhe receitas desbloqueadas e continue sua jornada culinária.
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
          <button
            key={stat.label}
            type="button"
            onClick={() => changeTab(stat.tab)}
            className="text-left"
          >
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
          </button>
        ))}
      </div>

      <Tabs value={currentTab} onValueChange={(value) => changeTab(resolveTab(value))}>
        <TabsList className="grid w-full max-w-xl grid-cols-4">
          <TabsTrigger value="resumo">Resumo</TabsTrigger>
          <TabsTrigger value="minhas-receitas">Minhas receitas</TabsTrigger>
          <TabsTrigger value="favoritos">Favoritos</TabsTrigger>
          <TabsTrigger value="compras">Compras</TabsTrigger>
        </TabsList>

        <TabsContent value="resumo" className="mt-4">
          <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ListChecks className="h-5 w-5 text-primary" />
                  Resumo rápido
                </CardTitle>
                <CardDescription>Seus dados principais em um só lugar.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Identidade</p>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Input
                      type="email"
                      value={identityInput}
                      onChange={(event) => setIdentityInput(event.target.value)}
                      placeholder="voce@email.com"
                    />
                    <Button onClick={() => void handleSaveIdentity()} disabled={savingIdentity}>
                      {savingIdentity ? "Salvando..." : "Atualizar"}
                    </Button>
                  </div>
                  <Button variant="ghost" className="px-0 text-muted-foreground" onClick={handleClearIdentity}>
                    Limpar identidade deste dispositivo
                  </Button>
                </div>

                <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                  {shoppingCount > 0
                    ? `Sua lista de compras tem ${shoppingCount} item(ns).`
                    : "Sua lista de compras ainda está vazia. Adicione ingredientes nas páginas de receita."}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Atalhos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link to="/minha-conta/favoritos"><Button variant="outline" className="w-full justify-start">Ver favoritos</Button></Link>
                <Link to="/minha-conta/lista-de-compras"><Button variant="outline" className="w-full justify-start">Abrir lista de compras</Button></Link>
                <Link to="/buscar"><Button className="w-full justify-start">Descobrir novas receitas</Button></Link>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="minhas-receitas" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LockOpen className="h-5 w-5 text-primary" />
                Minhas receitas desbloqueadas
              </CardTitle>
              <CardDescription>Receitas premium liberadas para seu e-mail.</CardDescription>
            </CardHeader>
            <CardContent>
              {unlocked.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {unlocked.map((recipe) => (
                    <Link key={recipe.id} to={`/receitas/${recipe.slug}`} className="overflow-hidden rounded-xl border transition hover:shadow-md">
                      <SmartImage
                        src={getRecipeImage(recipe)}
                        alt={recipe.title}
                        className="h-36 w-full object-cover"
                      />
                      <div className="space-y-1 p-3">
                        <p className="font-medium">{getRecipePresentation(recipe).cardTitle}</p>
                        <p className="text-xs text-muted-foreground">{recipe.totalTime} min • {recipe.servings} porções</p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
                  Você ainda não desbloqueou receitas premium. Explore a seção exclusiva e desbloqueie novas opções.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="favoritos" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-primary" />
                Favoritos salvos
              </CardTitle>
              <CardDescription>Atalho para as receitas que você marcou.</CardDescription>
            </CardHeader>
            <CardContent>
              {favoriteRecords.length > 0 ? (
                <div className="space-y-2">
                  {favoriteRecords.slice(0, 12).map((item) => (
                    <div key={item.id} className="rounded-lg border px-3 py-2 text-sm">
                      Receita: <span className="font-medium">{item.recipeId}</span>
                    </div>
                  ))}
                  <Link to="/minha-conta/favoritos"><Button variant="outline">Ver lista completa</Button></Link>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
                  Você ainda não favoritou receitas.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compras" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <WalletCards className="h-5 w-5 text-primary" />
                Histórico de compras (MVP)
              </CardTitle>
              <CardDescription>
                Enquanto o extrato detalhado não fica pronto, mostramos suas receitas premium já desbloqueadas.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {paidOwned.length > 0 ? (
                <div className="space-y-2">
                  {paidOwned.map((recipe) => (
                    <Link key={recipe.id} to={`/receitas/${recipe.slug}`} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm hover:bg-muted/30">
                      <span>{getRecipePresentation(recipe).cardTitle}</span>
                      <span className="text-muted-foreground">Acesso ativo</span>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
                  Nenhuma compra registrada para este e-mail até agora.
                </div>
              )}
              {shoppingPreview.length > 0 && (
                <div className="mt-6 rounded-lg border bg-muted/20 p-4">
                  <p className="mb-2 text-sm font-medium">Prévia da sua lista de compras</p>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {shoppingPreview.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
