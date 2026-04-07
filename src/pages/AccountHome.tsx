import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import {
  Heart,
  ListChecks,
  Loader2,
  LockOpen,
  ShoppingCart,
  UserRound,
  WalletCards,
} from 'lucide-react';
import { PageHead } from '@/components/PageHead';
import { useAppContext } from '@/contexts/app-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getRecipeImage, getRecipePresentation } from '@/lib/recipes/presentation';
import SmartImage from '@/components/SmartImage';
import type { RecipeRecord } from '@/lib/recipes/types';
import { getProfileOverview } from '@/lib/repos/profileRepo';
import { toast } from 'sonner';
import { LastSyncBadge } from '@/pwa/offline/ui/LastSyncBadge';
import { logger } from '@/lib/logger';
import { startSocialLogin } from '@/lib/api/socialAuth';
import {
  fetchMe,
  loginWithPassword,
  signupWithPassword,
  requestPasswordReset,
  requestMagicLink,
} from '@/lib/api/identity';
import { validatePasswordResetEmail } from '@/lib/validation/identity';

type AccountTab = 'resumo' | 'minhas-receitas' | 'favoritos' | 'compras';

function resolveTab(value: string | null): AccountTab {
  if (value === 'minhas-receitas' || value === 'favoritos' || value === 'compras') {
    return value;
  }
  return 'resumo';
}

export default function AccountHome() {
  const {
    favorites,
    favoriteRecords,
    identityEmail,
    requireIdentity,
    clearIdentity,
    updateIdentity,
  } = useAppContext();

  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const [currentTab, setCurrentTab] = useState<AccountTab>(() => resolveTab(params.get('tab')));
  const [shoppingCount, setShoppingCount] = useState(0);
  const [shoppingPreview, setShoppingPreview] = useState<string[]>([]);
  const [unlocked, setUnlocked] = useState<RecipeRecord[]>([]);
  const [paidOwned, setPaidOwned] = useState<RecipeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  const [emailInput, setEmailInput] = useState('');
  const [authorizing, setAuthorizing] = useState(false);

  useEffect(() => {
    setCurrentTab(resolveTab(params.get('tab')));
  }, [params]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const notifyOffline = () =>
      toast.info('Você está offline — acesse o app instalado para continuar.', {
        duration: 6000,
      });
    window.addEventListener('offline', notifyOffline);
    return () => {
      window.removeEventListener('offline', notifyOffline);
    };
  }, []);

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
        logger.error('account.overview', error);
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

  const stats = useMemo(
    () => [
      { label: 'Favoritos', value: favorites.length, icon: Heart, tab: 'favoritos' as AccountTab },
      {
        label: 'Lista de compras',
        value: shoppingCount,
        icon: ShoppingCart,
        tab: 'resumo' as AccountTab,
      },
      {
        label: 'Receitas desbloqueadas',
        value: unlocked.length,
        icon: LockOpen,
        tab: 'minhas-receitas' as AccountTab,
      },
    ],
    [favorites.length, shoppingCount, unlocked.length]
  );

  function changeTab(tab: AccountTab) {
    setCurrentTab(tab);
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        next.set('tab', tab);
        return next;
      },
      { replace: true }
    );
  }

  function handleClearIdentity() {
    clearIdentity();
    toast.success('Sessão de identidade removida neste dispositivo.');
  }

  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [authMode, setAuthMode] = useState<
    'magic-link' | 'password-login' | 'password-signup' | 'forgot-password'
  >('password-login');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = emailInput.trim().toLowerCase();
    if (!normalized || !normalized.includes('@')) {
      toast.error('Informe um e-mail válido.');
      return;
    }

    setAuthorizing(true);
    try {
      if (authMode === 'password-login') {
        if (!password) {
          toast.error('A senha é obrigatória.');
          return;
        }
        await loginWithPassword({ email: normalized, password });
        toast.success('Bem-vindo(a) de volta!');
      } else if (authMode === 'password-signup') {
        if (!password || !fullName) {
          toast.error('Nome e senha são obrigatórios.');
          return;
        }
        await signupWithPassword({
          email: normalized,
          password,
          fullName,
          tenantSlug: 'receitasbell',
        });
        toast.success('Conta criada com sucesso!');
      } else if (authMode === 'forgot-password') {
        const validation = validatePasswordResetEmail({ email: normalized });
        if (!validation.ok) {
          toast.error(validation.message);
          return;
        }
        await requestPasswordReset({ email: validation.email });
        toast.success('Instruções enviadas para seu e-mail.');
        setAuthMode('password-login');
        return;
      } else {
        await requestMagicLink({ email: normalized });
        toast.success('Link mágico enviado!');
        setAuthMode('password-login');
        return;
      }

      const user = await fetchMe();
      if (user?.email) {
        await updateIdentity(user.email);
        const redirectTo = params.get('redirect');
        if (redirectTo) {
          navigate(redirectTo);
        }
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao realizar login';
      toast.error(message);
    } finally {
      setAuthorizing(false);
    }
  };

  const handleGoogleLogin = async () => {
    setAuthorizing(true);
    try {
      const { authorizationUrl } = await startSocialLogin('google');
      window.location.assign(authorizationUrl);
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('auth.social.google', err);
      toast.error(err.message || 'Erro ao iniciar login com Google');
      setAuthorizing(false);
    }
  };

  if (!identityEmail) {
    return (
      <>
        <PageHead
          title="Minha Conta"
          description="Gerencie seu perfil, favoritos, lista de compras e compras realizadas"
          noindex={true}
        />
        <div className="container flex min-h-[80vh] items-center justify-center px-4 py-16">
          <div className="w-full max-w-sm space-y-8">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <UserRound className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <h1 className="text-2xl font-bold tracking-tight">
                  {authMode === 'password-login' && 'Entrar na sua conta'}
                  {authMode === 'password-signup' && 'Criar uma nova conta'}
                  {authMode === 'forgot-password' && 'Recuperar sua senha'}
                  {authMode === 'magic-link' && 'Entrar com link mágico'}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {authMode === 'password-login' && 'Digite seu e-mail e senha para continuar.'}
                  {authMode === 'password-signup' &&
                    'Informe seus dados para se juntar ao Receitas Bell.'}
                  {authMode === 'forgot-password' &&
                    'Enviaremos um link para você definir uma nova senha.'}
                  {authMode === 'magic-link' &&
                    'Enviaremos um link de acesso direto para seu e-mail.'}
                </p>
              </div>
            </div>

            <Card className="border-none bg-transparent shadow-none">
              <CardContent className="p-0">
                <form onSubmit={handleLogin} className="space-y-4">
                  {authMode === 'password-signup' && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium leading-none" htmlFor="fullName">
                        Nome Completo
                      </label>
                      <input
                        id="fullName"
                        placeholder="Ex: Maria Silva"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-medium leading-none" htmlFor="email">
                      E-mail
                    </label>
                    <input
                      id="email"
                      type="email"
                      placeholder="voce@exemplo.com"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      required
                      autoFocus
                      className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>

                  {(authMode === 'password-login' || authMode === 'password-signup') && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium leading-none" htmlFor="password">
                          Senha
                        </label>
                        {authMode === 'password-login' && (
                          <button
                            type="button"
                            onClick={() => setAuthMode('forgot-password')}
                            className="text-xs text-primary hover:underline"
                          >
                            Esqueci a senha
                          </button>
                        )}
                      </div>
                      <input
                        id="password"
                        type="password"
                        placeholder="Sua senha secreta"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
                      />
                    </div>
                  )}

                  <Button
                    type="submit"
                    size="lg"
                    className="h-12 w-full rounded-xl font-semibold shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70"
                    disabled={authorizing}
                  >
                    {authorizing ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" /> Processando...
                      </span>
                    ) : authMode === 'password-login' ? (
                      'Entrar na plataforma'
                    ) : authMode === 'password-signup' ? (
                      'Criar minha conta'
                    ) : (
                      'Enviar solicitação'
                    )}
                  </Button>
                </form>

                <div className="mt-6 flex flex-col gap-3 text-center">
                  <div className="flex flex-col gap-2">
                    {authMode === 'password-login' && (
                      <button
                        type="button"
                        onClick={() => setAuthMode('password-signup')}
                        className="text-sm text-muted-foreground"
                      >
                        Não tem uma conta?{' '}
                        <span className="font-semibold text-primary hover:underline">
                          Cadastre-se
                        </span>
                      </button>
                    )}
                    {authMode !== 'password-login' && (
                      <button
                        type="button"
                        onClick={() => setAuthMode('password-login')}
                        className="text-sm text-primary hover:underline font-medium"
                      >
                        Voltar para o login com senha
                      </button>
                    )}
                    {authMode === 'password-login' && (
                      <button
                        type="button"
                        onClick={() => setAuthMode('magic-link')}
                        className="text-xs flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground mt-2 border rounded-full py-2 transition-colors"
                      >
                        <LockOpen className="h-3 w-3" /> Entrar rápido sem senha (Link Mágico)
                      </button>
                    )}
                  </div>
                </div>

                <div className="relative my-8">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase">
                    <span className="bg-background px-3 text-muted-foreground font-medium tracking-widest">
                      OU ACESSE COM
                    </span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="h-12 w-full rounded-xl gap-3 font-medium transition-colors hover:bg-muted/50"
                  disabled={authorizing}
                  onClick={handleGoogleLogin}
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
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
                  </svg>
                  Continuar com Google
                </Button>
              </CardContent>
            </Card>

            <div className="text-center text-[11px] text-muted-foreground/60 leading-relaxed max-w-[280px] mx-auto text-pretty">
              Ao continuar, você concorda com nossos Termos de Uso e Política de Privacidade. Seu
              acesso é 100% seguro.
            </div>
          </div>
        </div>
      </>
    );
  }

  if (loading) {
    return (
      <>
        <PageHead
          title="Minha Conta"
          description="Gerencie seu perfil, favoritos, lista de compras e compras realizadas"
          noindex={true}
        />
        <div className="container px-4 py-16 text-center text-muted-foreground">
          Carregando sua conta...
        </div>
      </>
    );
  }

  return (
    <>
      <PageHead
        title="Minha Conta"
        description="Gerencie seu perfil, favoritos, lista de compras e compras realizadas"
        noindex={true}
      />
      <div className="container max-w-6xl space-y-8 px-4 py-10">
        <div className="space-y-4">
          <div className="rounded-3xl border bg-gradient-to-r from-orange-50 via-amber-50 to-background p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Minha Conta
                </p>
                <h1 className="text-3xl">Seu espaço pessoal no Receitas Bell</h1>
                <p className="text-muted-foreground">
                  Gerencie sua identidade, acompanhe receitas desbloqueadas e continue sua jornada
                  culinária.
                </p>
              </div>
              <div className="rounded-2xl border bg-background px-4 py-3 text-sm">
                <p className="flex items-center gap-2 font-medium">
                  <UserRound className="h-4 w-4 text-primary" />
                  {identityEmail || 'Visitante'}
                </p>
                <div className="mt-2">
                  <LastSyncBadge lastSyncedAt={lastSyncedAt} />
                </div>
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
                      Atualização de e-mail será reabilitada quando o endpoint de persistência
                      estiver disponível.
                    </p>
                    <Button
                      variant="link"
                      className="h-auto p-0 text-destructive hover:text-destructive/80 transition-colors"
                      onClick={handleClearIdentity}
                    >
                      Limpar identidade deste dispositivo
                    </Button>
                  </div>

                  <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                    {shoppingCount > 0
                      ? `Sua lista de compras tem ${shoppingCount} item(ns).`
                      : 'Sua lista de compras ainda está vazia. Adicione ingredientes nas páginas de receita.'}
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Atalhos</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Link to="/minha-conta/favoritos">
                      <Button variant="outline" className="w-full justify-start">
                        Ver favoritos
                      </Button>
                    </Link>
                    <Link to="/minha-conta/lista-de-compras">
                      <Button variant="outline" className="w-full justify-start">
                        Abrir lista de compras
                      </Button>
                    </Link>
                    <Link to="/buscar">
                      <Button className="w-full justify-start">Descobrir novas receitas</Button>
                    </Link>
                  </CardContent>
                </Card>
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
                      <Link
                        key={recipe.id}
                        to={`/receitas/${recipe.slug}`}
                        className="overflow-hidden rounded-xl border transition hover:shadow-md"
                      >
                        <SmartImage
                          src={getRecipeImage(recipe)}
                          alt={recipe.title}
                          className="h-36 w-full object-cover"
                        />
                        <div className="space-y-1 p-3">
                          <p className="font-medium">{getRecipePresentation(recipe).cardTitle}</p>
                          <p className="text-xs text-muted-foreground">
                            {recipe.totalTime} min • {recipe.servings} porções
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
                    Você ainda não desbloqueou receitas premium. Explore a seção exclusiva e
                    desbloqueie novas opções.
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
                    <Link to="/minha-conta/favoritos">
                      <Button variant="outline">Ver lista completa</Button>
                    </Link>
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
                  Enquanto o extrato detalhado não fica pronto, mostramos suas receitas premium já
                  desbloqueadas.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {paidOwned.length > 0 ? (
                  <div className="space-y-2">
                    {paidOwned.map((recipe) => (
                      <Link
                        key={recipe.id}
                        to={`/receitas/${recipe.slug}`}
                        className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm hover:bg-muted/30"
                      >
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
    </>
  );
}
