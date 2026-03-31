import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChefHat, Mail, ArrowRight, Loader2, Key, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { isValidEmail, requestMagicLink, loginWithPassword, signupWithPassword, requestPasswordReset } from "@/lib/api/identity";
import { InstallAppButton } from "../components/InstallAppButton";
import { buildPwaPath } from "@/pwa/app/navigation/pwa-paths";
import {
  persistPwaUserLoginEmail,
  readPwaUserLoginEmail,
} from "@/pwa/app/auth/pwa-auth-storage";
import { readPwaRedirect, savePwaRedirect } from "@/pwa/app/auth/pwa-auth-redirect";
import { resolvePwaTenantSlug } from "@/pwa/app/tenant/pwa-tenant-path";

type UserLoginMode = "magic-link" | "password-login" | "password-signup" | "forgot-password";

type UserLoginState =
  | "idle"
  | "submitting"
  | "sent"
  | "offline_error"
  | "retryable_error";

export default function UserLoginPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState(() => readPwaUserLoginEmail() || "");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [mode, setMode] = useState<UserLoginMode>("password-login");
  const [state, setState] = useState<UserLoginState>("idle");
  const [feedback, setFeedback] = useState("");
  
  const tenantSlug = useMemo(
    () => resolvePwaTenantSlug(location.pathname),
    [location.pathname],
  );

  const redirectTarget = useMemo(() => 
    readPwaRedirect() || buildPwaPath("home", { tenantSlug }),
    [tenantSlug]
  );

  async function handleMagicLink() {
    const normalized = email.trim().toLowerCase();
    if (!isValidEmail(normalized)) {
      toast.error("Informe um e-mail válido.");
      return;
    }

    setState("submitting");
    try {
      await requestMagicLink({ email: normalized, redirectTo: redirectTarget });
      setState("sent");
      toast.success("Link enviado!");
    } catch (err: unknown) {
      setState("idle");
      const message = err instanceof Error ? err.message : "Erro ao enviar link.";
      toast.error(message);
    }
  }

  async function handlePasswordLogin() {
    if (!email || !password) {
      toast.error("Preencha todos os campos.");
      return;
    }

    setState("submitting");
    try {
      await loginWithPassword({ email, password });
      toast.success("Bem-vindo(a)!");
      navigate(redirectTarget);
    } catch (err: unknown) {
      setState("idle");
      const message = err instanceof Error ? err.message : "Erro ao entrar. Verifique seus dados.";
      toast.error(message);
    }
  }

  async function handlePasswordSignup() {
    if (!email || !password || !fullName) {
      toast.error("Preencha todos os campos.");
      return;
    }

    setState("submitting");
    try {
      await signupWithPassword({ email, password, fullName });
      toast.success("Conta criada com sucesso!");
      navigate(redirectTarget);
    } catch (err: unknown) {
      setState("idle");
      const message = err instanceof Error ? err.message : "Erro ao criar conta.";
      toast.error(message);
    }
  }

  async function handleResetPassword() {
    if (!email) {
      toast.error("Informe seu e-mail.");
      return;
    }

    setState("submitting");
    try {
      await requestPasswordReset({ email });
      setState("sent");
      setFeedback("Instruções de recuperação enviadas.");
      toast.success("E-mail enviado!");
    } catch (err: unknown) {
      setState("idle");
      const message = err instanceof Error ? err.message : "Erro ao solicitar recuperação.";
      toast.error(message);
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "magic-link") handleMagicLink();
    else if (mode === "password-login") handlePasswordLogin();
    else if (mode === "password-signup") handlePasswordSignup();
    else if (mode === "forgot-password") handleResetPassword();
  };

  if (state === "sent") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
        <Card className="w-full max-w-sm border-none shadow-none bg-transparent text-center">
          <CardHeader className="space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Mail className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-2xl font-bold tracking-tight">Verifique seu e-mail</CardTitle>
              <CardDescription className="text-base text-balance">
                Enviamos instruções importantes para <strong>{email}</strong>. Por favor, confira sua caixa de entrada.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full" onClick={() => { setState("idle"); setMode("password-login"); }}>
              Voltar ao login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
      <div className="mb-8 flex flex-col items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
          <ChefHat className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Receitas Bell</h1>
      </div>

      <Card className="w-full max-w-sm border-none shadow-none bg-transparent">
        <CardHeader className="px-0 text-center">
          <CardTitle className="text-xl font-semibold">
            {mode === "password-login" && "Entrar"}
            {mode === "password-signup" && "Criar Conta"}
            {mode === "magic-link" && "Entrar sem Senha"}
            {mode === "forgot-password" && "Recuperar Senha"}
          </CardTitle>
          <CardDescription>
            {mode === "password-login" && "Acesse seu painel com sua conta."}
            {mode === "password-signup" && "Junte-se a nós para salvar suas receitas."}
            {mode === "magic-link" && "Receba um link de acesso por e-mail."}
            {mode === "forgot-password" && "Enviaremos um link para redefinir sua senha."}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0 pt-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "password-signup" && (
              <Input
                placeholder="Nome Completo"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="h-12"
              />
            )}
            <Input
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => {
                const val = e.target.value;
                setEmail(val);
                persistPwaUserLoginEmail(val);
              }}
              required
              className="h-12"
            />
            {(mode === "password-login" || mode === "password-signup") && (
              <Input
                type="password"
                placeholder="Sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12"
              />
            )}

            <Button type="submit" className="w-full h-12 text-base" disabled={state === "submitting"}>
              {state === "submitting" ? <Loader2 className="animate-spin h-5 w-5" /> : "Prosseguir"}
            </Button>
          </form>

          <div className="mt-4 flex flex-col gap-2 text-center text-sm">
            {mode === "password-login" && (
              <>
                <button type="button" onClick={() => setMode("forgot-password")} className="text-primary hover:underline">Esqueci minha senha</button>
                <button type="button" onClick={() => setMode("password-signup")} className="text-muted-foreground hover:text-foreground">Não tem conta? <span className="text-primary font-medium">Criar uma agora</span></button>
                <button type="button" onClick={() => setMode("magic-link")} className="mt-2 flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground border rounded-lg p-2 transition-colors">
                  <Key className="h-4 w-4" /> Entrar com Link Mágico
                </button>
              </>
            )}
            {(mode === "password-signup" || mode === "magic-link" || mode === "forgot-password") && (
              <button type="button" onClick={() => setMode("password-login")} className="text-primary hover:underline">Voltar para entrar com senha</button>
            )}
          </div>

          <div className="mt-8 flex flex-col gap-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground text-[10px]">OU</span></div>
            </div>
            
            <Button 
              variant="outline" 
              className="w-full h-12 gap-2"
              onClick={() => window.location.href = "/api/auth/oauth/start?provider=google"}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Entrar com Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground text-[10px]">OU EXPERIMENTE O APP</span></div>
            </div>
            <InstallAppButton context="user" variant="outline" className="w-full h-12" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
