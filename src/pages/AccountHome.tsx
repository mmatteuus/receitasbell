import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Heart, ListChecks, LockOpen, ShoppingCart, Smartphone, UserRound, WalletCards } from "lucide-react";
import { useAppContext } from "@/contexts/app-context";
import { useInstallPrompt } from "@/pwa/hooks/useInstallPrompt";
import { InstallAppButton } from "@/pwa/components/InstallAppButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getRecipeImage, getRecipePresentation } from "@/lib/recipes/presentation";
import SmartImage from "@/components/SmartImage";
import type { RecipeRecord } from "@/lib/recipes/types";
import { getProfileOverview } from "@/lib/repos/profileRepo";
import { toast } from "sonner";
import { LastSyncBadge } from "@/pwa/offline/ui/LastSyncBadge";
import { logger } from "@/lib/logger";
import { startSocialLogin } from "@/lib/api/socialAuth";

type AccountTab = "resumo" | "minhas-receitas" | "favoritos" | "compras";

function resolveTab(value: string | null): AccountTab {
  if (value === "minhas-receitas" || value === "favoritos" || value === "compras") {
    return value;
  }
  return "resumo";
}

export default function AccountHome() {
  const { favorites, favoriteRecords, identityEmail, requireIdentity, clearIdentity, updateIdentity } = useAppContext();
  const { isInstalled, deferredPrompt, isIOS } = useInstallPrompt();
  const showAppCard = !isInstalled && (!!deferredPrompt || isIOS);
  
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const [currentTab, setCurrentTab] = useState<AccountTab>(() => resolveTab(params.get("tab")));
  const [shoppingCount, setShoppingCount] = useState(0);
  const [shoppingPreview, setShoppingPreview] = useState<string[]>([]);
  const [unlocked, setUnlocked] = useState<RecipeRecord[]>([]);
  const [paidOwned, setPaidOwned] = useState<RecipeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  const [emailInput, setEmailInput] = useState("");
  const [authorizing, setAuthorizing] = useState(false);

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
        const overview = await getProfileOverview();
        if (!isMounted) return;
        setShoppingCount(overview.shoppingItems.length);
        setShoppingPreview(overview.shoppingItems.slice(0, 6).map((item) => item.text));
        setUnlocked(overview.unlockedRecipes);
        setPaidOwned(overview.purchasedRecipes);
        setLastSyncedAt(overview.lastSyncedAt || null);
      } catch (error) {
        logger.error("account.overview", error);
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

  function handleClearIdentity() {
    clearIdentity();
    toast.success("Sessão de identidade removida neste dispositivo.");
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim() || !emailInput.includes("@")) return;
    setAuthorizing(true);
    try {
      await updateIdentity(emailInput.trim());
      toast.success("Logado com sucesso!");
      const redirectTo = params.get("redirect");
      if (redirectTo) {
        navigate(redirectTo);
      }
    } catch {
      toast.error("Erro ao realizar login");
    } finally {
      setAuthorizing(false);
    }
  };

  const handleGoogleLogin = async () => {
    setAuthorizing(true);
    try {
      const { authorizationUrl } = await startSocialLogin("google");
      // O redirect para o Google remove o estado react, então não precisamos de finally aqui
      window.location.assign(authorizationUrl);
    } catch (error: any) {
      logger.error("auth.social.google", error);
      toast.error(error.message || "Erro ao iniciar login com Google");
      setAuthorizing(false);
    }
  };

  if (!identityEmail) {
    return (
      <div className="container flex min-h-[70vh] items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">Entrar ou criar conta</h1>
            <p className="text-sm text-muted-foreground">
              Digite seu e-mail para acompanhar favoritos, compras e acesso premium.
            </p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2 text-left">
              <input
                id="email"
                type="email"
                placeholder="nome@exemplo.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                required
                autoFocus
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <Button type="submit" className="w-full" disabled={authorizing}>
              {authorizing ? "Entrando..." : "Continuar com e-mail"}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">ou continue com</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full gap-2"
            disabled={authorizing}
            onClick={handleGoogleLogin}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.25.81-.59z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
              <path d="M1 1h22v22H1z" fill="none" />
            </svg>
            Google
          </Button>
          <div className="text-center text-xs text-muted-foreground">
            Sua identidade será salva localmente até a conexão final com o provedor.
          </div>
        </div>
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
            <div className="mt-2">
              <LastSyncBadge lastSyncedAt={lastSyncedAt} />
            </div>
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
                  <div className="rounded-xl border border-dashed p-3 text-sm text-muted-foreground">
                    {identityEmail}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Atualização de e-mail será reabilitada quando o endpoint de persistência estiver disponível.
                  </p>
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

            <div className="space-y-6">
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

              {showAppCard && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Smartphone className="h-5 w-5 text-primary" />
                      Aplicativo
                    </CardTitle>
                    <CardDescription>Acesso rápido na tela inicial.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <InstallAppButton context="user" className="w-full" />
                  </CardContent>
                </Card>
              )}
            </div>
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
