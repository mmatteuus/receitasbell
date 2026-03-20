import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { ChefHat, LockKeyhole, Mail, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  bootstrapAdmin,
  getAdminSession,
  loginAdmin,
  type AdminSessionResponse,
} from "@/lib/api/adminSession";
import { ApiClientError } from "@/lib/api/client";
import { buildTenantAdminPath, buildTenantPath, extractTenantSlugFromPath } from "@/lib/tenant";
import { trackEvent } from "@/lib/telemetry";

export default function AdminLoginPage() {
  const location = useLocation();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const tenantSlugFromPath = useMemo(() => extractTenantSlugFromPath(location.pathname), [location.pathname]);
  const defaultRedirect = buildTenantAdminPath("", tenantSlugFromPath);
  const redirectTo = params.get("redirect") || defaultRedirect;

  const [session, setSession] = useState<AdminSessionResponse | null>(null);
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [tenantName, setTenantName] = useState("");
  const [bootstrapSlug, setBootstrapSlug] = useState(tenantSlugFromPath || "");
  const [bootstrapEmail, setBootstrapEmail] = useState("");
  const [bootstrapPassword, setBootstrapPassword] = useState("");

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      try {
        const nextSession = await getAdminSession();
        if (!active) return;
        setSession(nextSession);
        if (nextSession.authenticated) {
          navigate(redirectTo, { replace: true });
        }
      } catch {
        if (!active) return;
        setSession(null);
      } finally {
        if (active) setChecking(false);
      }
    }

    void bootstrap();
    return () => {
      active = false;
    };
  }, [navigate, redirectTo]);

  async function refreshSession() {
    const nextSession = await getAdminSession();
    setSession(nextSession);
    return nextSession;
  }

  async function handleTenantLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await loginAdmin({ email, password });
      setSession(result);
      if (result.authenticated) {
        trackEvent("admin.login.success", { redirectTo });
        navigate(redirectTo, { replace: true });
      }
    } catch (err) {
      trackEvent("admin.login.failed");
      if (err instanceof ApiClientError) {
        setError(err.message || "Credenciais inválidas.");
      } else {
        setError("Não foi possível autenticar no momento.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleLegacyUnlock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await loginAdmin({ password });
      setSession(result);
      if (result.authenticated) {
        navigate(redirectTo, { replace: true });
        return;
      }
      await refreshSession();
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message || "Senha inválida.");
      } else {
        setError("Não foi possível validar a senha do admin legado.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleBootstrap(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await bootstrapAdmin({
        tenantName,
        tenantSlug: bootstrapSlug,
        adminEmail: bootstrapEmail,
        adminPassword: bootstrapPassword,
      });
      setSession(result);
      trackEvent("admin.bootstrap.success", { tenantSlug: bootstrapSlug });
      navigate(redirectTo, { replace: true });
    } catch (err) {
      trackEvent("admin.bootstrap.failed");
      if (err instanceof ApiClientError) {
        setError(err.message || "Não foi possível criar o primeiro tenant.");
      } else {
        setError("Não foi possível concluir o bootstrap inicial.");
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

  const bootstrapRequired = session?.bootstrapRequired;
  const showLegacyPasswordOnly = bootstrapRequired ? !session?.legacyAdminAuthenticated : !session?.databaseConfigured;

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
          <CardDescription>
            {bootstrapRequired
              ? showLegacyPasswordOnly
                ? "Valide o admin legado para criar o primeiro tenant."
                : "Crie o primeiro tenant e o usuário administrador."
              : session?.databaseConfigured
                ? `Entre no admin${session?.tenant ? ` de ${session.tenant.name}` : ""}.`
                : "Modo legado ativo. Use a senha do admin global."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {showLegacyPasswordOnly ? (
            <form className="space-y-4" onSubmit={handleLegacyUnlock}>
              <div className="space-y-2">
                <label htmlFor="admin-password" className="text-sm font-medium">
                  Senha do admin legado
                </label>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="admin-password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Digite a senha"
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              {error ? <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p> : null}

              <Button type="submit" className="w-full" disabled={loading || !password.trim()}>
                {loading ? "Validando..." : bootstrapRequired ? "Desbloquear bootstrap" : "Entrar no admin"}
              </Button>

              <Button type="button" variant="ghost" className="w-full" asChild>
                <Link to={buildTenantPath("/", tenantSlugFromPath)}>Voltar para o site</Link>
              </Button>
            </form>
          ) : bootstrapRequired ? (
            <form className="space-y-4" onSubmit={handleBootstrap}>
              <div className="space-y-2">
                <label htmlFor="tenant-name" className="text-sm font-medium">
                  Nome do tenant
                </label>
                <div className="relative">
                  <Store className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="tenant-name"
                    value={tenantName}
                    onChange={(event) => setTenantName(event.target.value)}
                    placeholder="Ex.: Receitas Bell"
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="tenant-slug" className="text-sm font-medium">
                  Slug do tenant
                </label>
                <Input
                  id="tenant-slug"
                  value={bootstrapSlug}
                  onChange={(event) => setBootstrapSlug(event.target.value)}
                  placeholder="receitas-bell"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="bootstrap-email" className="text-sm font-medium">
                  E-mail do admin
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="bootstrap-email"
                    type="email"
                    autoComplete="email"
                    value={bootstrapEmail}
                    onChange={(event) => setBootstrapEmail(event.target.value)}
                    placeholder="admin@cliente.com"
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="bootstrap-password" className="text-sm font-medium">
                  Senha do admin do tenant
                </label>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="bootstrap-password"
                    type="password"
                    autoComplete="new-password"
                    value={bootstrapPassword}
                    onChange={(event) => setBootstrapPassword(event.target.value)}
                    placeholder="Defina uma senha segura"
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              {error ? <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p> : null}

              <Button
                type="submit"
                className="w-full"
                disabled={
                  loading ||
                  !tenantName.trim() ||
                  !bootstrapSlug.trim() ||
                  !bootstrapEmail.trim() ||
                  !bootstrapPassword.trim()
                }
              >
                {loading ? "Criando tenant..." : "Criar primeiro tenant"}
              </Button>
            </form>
          ) : (
            <form className="space-y-4" onSubmit={handleTenantLogin}>
              <div className="space-y-2">
                <label htmlFor="admin-email" className="text-sm font-medium">
                  E-mail
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="admin-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="admin@cliente.com"
                    className="pl-9"
                    required
                  />
                </div>
              </div>

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

              {error ? <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p> : null}

              <Button type="submit" className="w-full" disabled={loading || !email.trim() || !password.trim()}>
                {loading ? "Entrando..." : "Entrar no admin"}
              </Button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Ou continue com</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full border-[#009EE3] text-[#009EE3] hover:bg-[#009EE3] hover:text-white transition-colors gap-2"
                onClick={() => (window.location.href = "/api/admin/auth/mp-login")}
              >
                <img src="https://http2.mlstatic.com/frontend-assets/ml-web-navigation/ui-navigation/5.21.22/mercadopago/logo__small.png" alt="MP" className="h-4" />
                Entrar com Mercado Pago
              </Button>

              <Button type="button" variant="ghost" className="w-full" asChild>
                <Link to={buildTenantPath("/", tenantSlugFromPath)}>Voltar para o site</Link>
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
