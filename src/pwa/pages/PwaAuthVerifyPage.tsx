import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchMe, verifyMagicLink } from "@/lib/api/identity";

export default function PwaAuthVerifyPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"checking" | "error">("checking");
  const [errorMessage, setErrorMessage] = useState("Validando seu acesso...");

  useEffect(() => {
    let active = true;

    async function run() {
      const token = params.get("token");
      if (!token) {
        if (!active) return;
        setStatus("error");
        setErrorMessage("O link de acesso não contém um token válido.");
        return;
      }

      try {
        await verifyMagicLink({ token });
        await fetchMe({ allowOffline: false });
        if (!active) return;
        navigate("/pwa/app", { replace: true });
      } catch {
        if (!active) return;
        setStatus("error");
        setErrorMessage("Não foi possível validar o link de acesso. Solicite um novo link.");
      }
    }

    void run();

    return () => {
      active = false;
    };
  }, [navigate, params]);

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
            <CardTitle className="text-2xl font-bold tracking-tight">Link inválido</CardTitle>
            <CardDescription className="text-base">{errorMessage}</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Button className="w-full" onClick={() => navigate("/pwa/login", { replace: true })}>
            Voltar ao login
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
