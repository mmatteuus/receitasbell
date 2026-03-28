import { useEffect, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchMe, verifyMagicLink } from "@/lib/api/identity";
import { ApiClientError } from "@/lib/api/client";
import { buildPwaPath } from "@/pwa/app/navigation/pwa-paths";
import {
  clearPwaRedirect,
  readPwaRedirect,
} from "@/pwa/app/auth/pwa-auth-redirect";
import { resolvePwaTenantSlug } from "@/pwa/app/tenant/pwa-tenant-path";

export default function PwaAuthVerifyPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState<"checking" | "error">("checking");
  const [errorMessage, setErrorMessage] = useState("Validando seu acesso...");
  const [errorTitle, setErrorTitle] = useState("Link inválido");

  useEffect(() => {
    let active = true;

    async function run() {
      const tenantSlug = resolvePwaTenantSlug(location.pathname);
      const token = params.get("token");
      if (!token) {
        if (!active) return;
        setStatus("error");
        setErrorTitle("Link inválido");
        setErrorMessage("O link de acesso não contém um token válido.");
        return;
      }

      try {
        const verifyResult = await verifyMagicLink({ token });
        await fetchMe({ allowOffline: false });
        if (!active) return;

        const redirectFromStorage = readPwaRedirect();
        const apiRedirectTo = verifyResult.data?.redirectTo;
        const redirectTenantSlug = verifyResult.data?.tenantSlug ?? tenantSlug;
        const redirectTarget =
          apiRedirectTo
          ?? redirectFromStorage
          ?? buildPwaPath("home", { tenantSlug: redirectTenantSlug });

        clearPwaRedirect();
        navigate(redirectTarget, { replace: true });
      } catch (error) {
        if (!active) return;
        setStatus("error");

        if (typeof navigator !== "undefined" && !navigator.onLine) {
          setErrorTitle("Sem conexão");
          setErrorMessage("Você está offline. Conecte-se à internet para validar seu link de acesso.");
          return;
        }

        if (error instanceof ApiClientError && (error.status === 400 || error.status === 404)) {
          setErrorTitle("Link inválido");
          setErrorMessage("Esse link não é válido. Solicite um novo link de acesso.");
          return;
        }

        if (error instanceof ApiClientError && (error.status === 401 || error.status === 410)) {
          setErrorTitle("Link expirado");
          setErrorMessage("Este link expirou. Solicite um novo link para continuar.");
          return;
        }

        setErrorTitle("Erro inesperado");
        setErrorMessage("Não foi possível validar o link agora. Tente novamente em instantes.");
      }
    }

    void run();

    return () => {
      active = false;
    };
  }, [location.pathname, navigate, params]);

  if (status === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <div className="space-y-1">
            <h1 className="text-lg font-semibold">Entrando no app</h1>
            <p className="text-sm text-muted-foreground">{errorMessage}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <Card className="w-full max-w-sm border-none bg-transparent text-center shadow-none">
        <CardHeader className="space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold tracking-tight">{errorTitle}</CardTitle>
            <CardDescription className="text-base">{errorMessage}</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Button
            className="w-full"
            onClick={() => navigate(buildPwaPath("login", { tenantSlug: resolvePwaTenantSlug(location.pathname) }), { replace: true })}
          >
            Voltar ao login
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
