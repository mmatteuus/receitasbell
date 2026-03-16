import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ChefHat, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getAdminSession, loginAdmin } from "@/lib/api/adminSession";
import { ApiClientError } from "@/lib/api/client";
import { trackEvent } from "@/lib/telemetry";

export default function AdminLoginPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");

  const redirectTo = params.get("redirect") || "/admin";

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      try {
        const session = await getAdminSession();
        if (!active) return;
        if (session.authenticated) {
          navigate(redirectTo, { replace: true });
          return;
        }
      } catch {
        // Ignora erro e mantém na tela de login.
      } finally {
        if (active) setChecking(false);
      }
    }

    void bootstrap();
    return () => {
      active = false;
    };
  }, [navigate, redirectTo]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await loginAdmin(password);
      if (result.authenticated) {
        trackEvent("admin.login.success", { redirectTo });
        navigate(redirectTo, { replace: true });
      }
    } catch (err) {
      trackEvent("admin.login.failed");
      if (err instanceof ApiClientError) {
        setError(err.message || "Senha inválida.");
      } else {
        setError("Não foi possível autenticar no momento.");
      }
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
        <p className="text-sm text-muted-foreground">Preparando acesso do admin...</p>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-b from-orange-50 via-amber-50/60 to-background px-4 py-12">
      <div className="pointer-events-none absolute -left-24 top-6 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-8 h-64 w-64 rounded-full bg-amber-300/20 blur-3xl" />

      <Card className="w-full max-w-md border-0 shadow-xl">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <ChefHat className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl">Painel Receitas Bell</CardTitle>
          <CardDescription>Digite a senha do admin para continuar.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label htmlFor="admin-password" className="text-sm font-medium">
                Senha
              </label>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="admin-password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Digite sua senha"
                  className="pl-9"
                  required
                />
              </div>
            </div>

            {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

            <Button type="submit" className="w-full" disabled={loading || !password.trim()}>
              {loading ? "Entrando..." : "Entrar no admin"}
            </Button>

            <Button type="button" variant="ghost" className="w-full" asChild>
              <Link to="/">Voltar para o site</Link>
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
