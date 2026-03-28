import { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChefHat, Mail, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { isValidEmail, requestMagicLink } from "@/lib/api/identity";
import { InstallAppButton } from "../components/InstallAppButton";
import { buildPwaPath } from "@/pwa/app/navigation/pwa-paths";
import {
  persistPwaUserLoginEmail,
  readPwaUserLoginEmail,
} from "@/pwa/app/auth/pwa-auth-storage";
import { readPwaRedirect, savePwaRedirect } from "@/pwa/app/auth/pwa-auth-redirect";
import { resolvePwaTenantSlug } from "@/pwa/app/tenant/pwa-tenant-path";

type UserLoginState =
  | "idle"
  | "submitting"
  | "sent"
  | "offline_error"
  | "retryable_error";

export default function UserLoginPage() {
  const location = useLocation();
  const [email, setEmail] = useState(() => readPwaUserLoginEmail());
  const [state, setState] = useState<UserLoginState>("idle");
  const [feedback, setFeedback] = useState("");
  const tenantSlug = useMemo(
    () => resolvePwaTenantSlug(location.pathname),
    [location.pathname],
  );

  async function submitMagicLink() {
    const normalized = email.trim().toLowerCase();

    persistPwaUserLoginEmail(normalized);

    if (!isValidEmail(normalized)) {
      setState("retryable_error");
      setFeedback("Por favor, informe um e-mail válido.");
      toast.error("Por favor, informe um e-mail válido.");
      return;
    }

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setState("offline_error");
      setFeedback("Você está offline. Conecte-se para solicitar o link mágico.");
      return;
    }

    setState("submitting");
    setFeedback("");

    const redirectTarget =
      readPwaRedirect()
      || buildPwaPath("home", { tenantSlug });
    savePwaRedirect(redirectTarget);

    try {
      await requestMagicLink({
        email: normalized,
        redirectTo: redirectTarget,
      });

      setState("sent");
      setFeedback(`Enviamos um link de acesso para ${normalized}.`);
      toast.success("Link de acesso enviado!");
    } catch {
      setState("retryable_error");
      setFeedback("Ocorreu um erro ao enviar o link. Tente novamente.");
      toast.error("Ocorreu um erro ao enviar o link. Tente novamente.");
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitMagicLink();
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
              <CardDescription className="text-base">
                Enviamos um link de acesso para <strong>{email}</strong>. Clique no link para entrar no app.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p aria-live="polite" className="text-sm text-muted-foreground">
              {feedback}
            </p>
            <Button
              variant="default"
              className="w-full"
              onClick={() => void submitMagicLink()}
            >
              Reenviar link
            </Button>
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => setState("idle")}
            >
              Tentar com outro e-mail
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
          <CardTitle className="text-xl font-semibold">Entrar</CardTitle>
          <CardDescription>
            Informe seu e-mail para acessar suas receitas e favoritos.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0 pt-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  persistPwaUserLoginEmail(e.target.value);
                  if (state === "offline_error" || state === "retryable_error") {
                    setState("idle");
                    setFeedback("");
                  }
                }}
                required
                className="h-12 text-base"
                autoFocus
              />
            </div>
            {(state === "offline_error" || state === "retryable_error") && (
              <p aria-live="polite" className="text-sm text-destructive">
                {feedback}
              </p>
            )}
            <Button
              type="submit"
              className="w-full h-12 text-base font-medium"
              disabled={state === "submitting"}
            >
              {state === "submitting" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  Entrar com link mágico
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-8 flex flex-col gap-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Ou instale o app</span>
              </div>
            </div>
            
            <InstallAppButton context="user" variant="outline" className="w-full h-12" />
          </div>
        </CardContent>
      </Card>
      
      <p className="mt-8 text-center text-sm text-muted-foreground">
        Não tem uma conta? Ao entrar, nós criaremos uma para você.
      </p>
    </div>
  );
}
