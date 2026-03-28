import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { ChefHat, Eye, EyeOff, LockKeyhole, Mail, Store } from "lucide-react";
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
  const [showPassword, setShowPassword] = useState(false);

  const [tenantName, setTenantName] = useState("");
  const [bootstrapSlug, setBootstrapSlug] = useState(tenantSlugFromPath || "");
  const [bootstrapEmail, setBootstrapEmail] = useState("");
  const [bootstrapPassword, setBootstrapPassword] = useState("");
  const [bootstrapPasswordConfirm, setBootstrapPasswordConfirm] = useState("");

  const resolveAdminRedirect = useCallback(
    (nextSession: AdminSessionResponse) =>
      params.get("redirect") || buildTenantAdminPath("", nextSession.tenant?.slug || tenantSlugFromPath),
    [params, tenantSlugFromPath],
  );

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      try {
        const nextSession = await getAdminSession();
        if (!active) return;
        setSession(nextSession);
        if (nextSession.authenticated) {
          navigate(resolveAdminRedirect(nextSession), { replace: true });
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
  }, [navigate, redirectTo, resolveAdminRedirect]);

  async function handleTenantLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await loginAdmin({ email, password });
      setSession(result);
      if (result.authenticated) {
        trackEvent("admin.login.success", { redirectTo });
        navigate(resolveAdminRedirect(result), { replace: true });
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
      navigate(resolveAdminRedirect(result), { replace: true });
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
      <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4" aria-live="polite" aria-busy="true">
        <p className="text-sm text-muted-foreground">Preparando acesso do admin...</p>
      </div>
    );
  }
  const bootstrapRequired = session?.bootstrapRequired;
  const authenticated = session?.authenticated;
  const showLegacyUnlock = bootstrapRequired && !authenticated;
  const showBootstrapForm = bootstrapRequired && authenticated;
  const bootstrapPasswordsMatch = bootstrapPassword === bootstrapPasswordConfirm;

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-b from-orange-50 via-amber-50/60 to-background px-4 py-12">
      <div className="pointer-events-none absolute -left-24 top-6 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-8 h-64 w-64 rounded-full bg-amber-300/20 blur-3xl" />

      <Card className="w-full max-w-md border-0 shadow-xl">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <ChefHat aria-hidden="true" className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl">Painel Receitas Bell</CardTitle>
          <CardDescription>
            {showLegacyUnlock
              ? "Valide o admin legado para iniciar a configuração."
              : showBootstrapForm
                ? "Crie o primeiro tenant e o usuário administrador."
                : `Entre no admin${session?.tenant ? ` de ${session.tenant.name}` : ""}.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {showLegacyUnlock ? (
            <div className="space-y-6 text-center py-2">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                <LockKeyhole aria-hidden="true" className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Configuração inicial pendente</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  O sistema está aguardando a configuração inicial da plataforma.
                  Entre em contato com o suporte para continuar.
                </p>
              </div>

              {error ? <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p> : null}

              <Button type="button" variant="ghost" className="w-full" asChild>
                <Link to={buildTenantPath("/", tenantSlugFromPath)}>Voltar para o site</Link>
              </Button>
            </div>
          ) : showBootstrapForm ? (
            <form className="space-y-4" onSubmit={handleBootstrap}>
              <div className="space-y-2">
                <label htmlFor="tenant-name" className="text-sm font-medium">
                  Nome do tenant
                </label>
                <div className="relative">
                  <Store aria-hidden="true" className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
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
                  Senha inicial do admin
                </label>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="bootstrap-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={bootstrapPassword}
                    onChange={(event) => setBootstrapPassword(event.target.value)}
                    placeholder="Crie uma senha forte"
                    className="pl-9 pr-10"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="sr-only">{showPassword ? "Ocultar senha" : "Exibir senha"}</span>
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="bootstrap-password-confirm" className="text-sm font-medium">
                  Confirmar senha
                </label>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="bootstrap-password-confirm"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={bootstrapPasswordConfirm}
                    onChange={(event) => setBootstrapPasswordConfirm(event.target.value)}
                    placeholder="Repita a senha"
                    className="pl-9 pr-10"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="sr-only">{showPassword ? "Ocultar senha" : "Exibir senha"}</span>
                  </Button>
                </div>
                {!bootstrapPasswordsMatch && bootstrapPasswordConfirm ? (
                  <p className="text-xs text-destructive">As senhas não coincidem.</p>
                ) : null}
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
                  !bootstrapPassword.trim() ||
                  !bootstrapPasswordsMatch
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
                    autoFocus
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
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Digite sua senha"
                    className="pl-9 pr-10"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="sr-only">{showPassword ? "Ocultar senha" : "Exibir senha"}</span>
                  </Button>
                </div>
              </div>

              {error ? <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p> : null}

              <Button type="submit" className="w-full" disabled={loading || !email.trim() || !password.trim()}>
                {loading ? "Entrando..." : "Entrar no admin"}
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
