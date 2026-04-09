import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PageHead } from '@/components/PageHead';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChefHat, Mail, Loader2, Eye, EyeOff, Home } from 'lucide-react';
import { toast } from 'sonner';
import { loginWithPassword, signupWithPassword, requestPasswordReset } from '@/lib/api/identity';
import { loginAdmin } from '@/lib/api/adminSession';
import { startSocialLogin } from '@/lib/api/socialAuth';
import { validatePasswordResetEmail } from '@/lib/validation/identity';
import { InstallAppButton } from '../components/InstallAppButton';
import { buildPwaPath, buildPwaAdminPath } from '@/pwa/app/navigation/pwa-paths';
import { persistPwaUserLoginEmail, readPwaUserLoginEmail } from '@/pwa/app/auth/pwa-auth-storage';
import { readPwaRedirect, savePwaRedirect } from '@/pwa/app/auth/pwa-auth-redirect';
import { resolvePwaTenantSlug } from '@/pwa/app/tenant/pwa-tenant-path';

type LoginMode = 'login' | 'signup' | 'forgot-password';
type LoginState = 'idle' | 'submitting' | 'sent';

export default function UserLoginPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState(() => readPwaUserLoginEmail() || '');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState<LoginMode>('login');
  const [state, setState] = useState<LoginState>('idle');

  const tenantSlug = useMemo(() => resolvePwaTenantSlug(location.pathname), [location.pathname]);

  const redirectTarget = useMemo(
    () => readPwaRedirect() || buildPwaPath('home', { tenantSlug }),
    [tenantSlug]
  );

  // Login unificado: tenta usuário comum primeiro, depois admin.
  // Usuário comum vai para o app; admin vai para o painel admin.
  async function handleLogin() {
    if (!email || !password) {
      toast.error('Preencha e-mail e senha.');
      return;
    }

    setState('submitting');
    persistPwaUserLoginEmail(email);

    // 1. Tenta login como usuário comum
    try {
      await loginWithPassword({ email, password });
      toast.success('Bem-vindo(a)!');
      navigate(redirectTarget, { replace: true });
      return;
    } catch {
      // Não é usuário comum — tenta como admin
    }

    // 2. Tenta login como admin
    try {
      const adminResult = await loginAdmin({ email, password });
      if (adminResult.authenticated) {
        toast.success(`Bem-vindo(a), ${adminResult.user?.email ?? 'admin'}!`);
        navigate(buildPwaAdminPath({ tenantSlug }), { replace: true });
        return;
      }
    } catch (err: unknown) {
      setState('idle');
      const message = err instanceof Error ? err.message : 'E-mail ou senha incorretos.';
      toast.error(message);
    }

    setState('idle');
    toast.error('E-mail ou senha incorretos.');
  }

  async function handleSignup() {
    if (!email || !password || !fullName) {
      toast.error('Preencha todos os campos.');
      return;
    }

    const targetTenantSlug = tenantSlug || 'receitasbell';
    setState('submitting');
    try {
      await signupWithPassword({ email, password, fullName, tenantSlug: targetTenantSlug });
      toast.success('Conta criada com sucesso!');
      navigate(redirectTarget, { replace: true });
    } catch (err: unknown) {
      setState('idle');
      const message = err instanceof Error ? err.message : 'Erro ao criar conta.';
      toast.error(message);
    }
  }

  async function handleForgotPassword() {
    const validation = validatePasswordResetEmail({ email });
    if (!validation.ok) {
      toast.error(validation.message);
      return;
    }

    setState('submitting');
    try {
      await requestPasswordReset({ email: validation.email });
      setState('sent');
      toast.success('E-mail enviado!');
    } catch (err: unknown) {
      setState('idle');
      const message = err instanceof Error ? err.message : 'Erro ao solicitar recuperação.';
      toast.error(message);
    }
  }

  async function handleGoogleLogin() {
    const targetTenantSlug = tenantSlug || 'receitasbell';
    const targetRedirect = redirectTarget || buildPwaPath('home', { tenantSlug: targetTenantSlug });
    savePwaRedirect(targetRedirect);

    setState('submitting');
    try {
      const { authorizationUrl } = await startSocialLogin('google', {
        redirectTo: targetRedirect,
        tenantSlug: targetTenantSlug,
      });
      window.location.assign(authorizationUrl);
    } catch (err: unknown) {
      setState('idle');
      const message = err instanceof Error ? err.message : 'Erro ao iniciar login com Google.';
      toast.error(message);
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'login') handleLogin();
    else if (mode === 'signup') handleSignup();
    else if (mode === 'forgot-password') handleForgotPassword();
  };

  // Tela de confirmação de e-mail enviado
  if (state === 'sent') {
    return (
      <>
        <PageHead title="Verifique seu e-mail" noindex />
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
          <Card className="w-full max-w-sm border-none shadow-none bg-transparent text-center">
            <CardHeader className="space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Mail className="h-8 w-8" />
              </div>
              <div className="space-y-2">
                <CardTitle className="text-2xl font-bold tracking-tight">
                  Verifique seu e-mail
                </CardTitle>
                <CardDescription className="text-base text-balance">
                  Enviamos instruções para <strong>{email}</strong>. Confira sua caixa de entrada.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setState('idle');
                  setMode('login');
                }}
              >
                Voltar ao login
              </Button>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHead
        title={mode === 'login' ? 'Entrar' : mode === 'signup' ? 'Criar conta' : 'Recuperar senha'}
        noindex
      />
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
            <ChefHat className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Receitas Bell</h1>
        </div>

        <Card className="w-full max-w-sm border-none shadow-none bg-transparent">
          <CardHeader className="px-0 text-center">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1" />
              <CardTitle className="text-xl font-semibold flex-1">
                {mode === 'login' && 'Entrar'}
                {mode === 'signup' && 'Criar Conta'}
                {mode === 'forgot-password' && 'Recuperar Senha'}
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                className="flex-1 justify-end"
                onClick={() => navigate('/', { replace: false })}
                title="Ir para página principal"
              >
                <Home className="h-5 w-5" />
              </Button>
            </div>
            <CardDescription>
              {mode === 'login' && 'Admin ou usuário — entre com sua conta.'}
              {mode === 'signup' && 'Junte-se a nós para salvar suas receitas.'}
              {mode === 'forgot-password' && 'Enviaremos um link para redefinir sua senha.'}
            </CardDescription>
          </CardHeader>

          <CardContent className="px-0 pt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <Input
                  placeholder="Nome completo"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="h-12"
                  autoComplete="name"
                />
              )}

              <Input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  persistPwaUserLoginEmail(e.target.value);
                }}
                required
                className="h-12"
                autoComplete="email"
                autoFocus
              />

              {(mode === 'login' || mode === 'signup') && (
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-12 pr-12"
                    autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 text-base"
                disabled={state === 'submitting'}
              >
                {state === 'submitting' ? (
                  <Loader2 className="animate-spin h-5 w-5" />
                ) : mode === 'login' ? (
                  'Entrar'
                ) : mode === 'signup' ? (
                  'Criar conta'
                ) : (
                  'Enviar instruções'
                )}
              </Button>
            </form>

            {/* Links de navegação entre modos */}
            <div className="mt-4 flex flex-col gap-2 text-center text-sm">
              {mode === 'login' && (
                <>
                  <button
                    type="button"
                    onClick={() => setMode('forgot-password')}
                    className="text-primary hover:underline"
                  >
                    Esqueci minha senha
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('signup')}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Não tem conta? <span className="text-primary font-medium">Criar uma agora</span>
                  </button>
                </>
              )}
              {(mode === 'signup' || mode === 'forgot-password') && (
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-primary hover:underline"
                >
                  Voltar para entrar
                </button>
              )}
            </div>

            {/* Google OAuth e instalar app — só no modo login */}
            {mode === 'login' && (
              <div className="mt-8 flex flex-col gap-4">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground text-[10px]">OU</span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full h-12 gap-2"
                  type="button"
                  disabled={state === 'submitting'}
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
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Entrar com Google
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground text-[10px]">
                      OU EXPERIMENTE O APP
                    </span>
                  </div>
                </div>
                <InstallAppButton context="user" variant="outline" className="w-full h-12" />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
