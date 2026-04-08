import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { ApiClientError } from "@/lib/api/client";
import { fetchMe, isValidEmail, logoutUser, requestMagicLink } from "@/lib/api/identity";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Heart } from "lucide-react";
import { isPwaRuntimePath } from "@/pwa/offline/runtime";

type IdentityDialogState = {
  open: boolean;
  mode: "login-prompt" | "email-form";
  message: string;
  email: string;
  error: string;
};

const initialDialogState: IdentityDialogState = {
  open: false,
  mode: "login-prompt",
  message: "",
  email: "",
  error: "",
};

export function useIdentityProvider() {
  const [identityEmail, setIdentityEmail] = useState<string | null>(null);
  const [identityDialog, setIdentityDialog] = useState<IdentityDialogState>(initialDialogState);
  const [identityLoading, setIdentityLoading] = useState(false);
  const [identityResolver, setIdentityResolver] = useState<((value: string | null) => void) | null>(null);

  useEffect(() => {
    void fetchMe().then((user) => {
      if (user?.email) {
        setIdentityEmail(user.email);
      }
    });
  }, []);

  const requireIdentity = useCallback(async (message?: string, mode: "login-prompt" | "email-form" = "login-prompt") => {
    if (identityEmail) {
      return identityEmail;
    }

    if (typeof window !== "undefined" && isPwaRuntimePath(window.location.pathname)) {
      return null;
    }

    const email = await new Promise<string | null>((resolve) => {
      setIdentityResolver(() => resolve);
      setIdentityDialog({
        open: true,
        mode,
        message: message || "Para favoritar receitas é preciso estar conectado à sua conta.",
        email: "",
        error: "",
      });
    });

    setIdentityEmail(email);
    return email;
  }, [identityEmail]);

  const updateIdentity = useCallback(async (email: string) => {
    const normalized = email.trim().toLowerCase();
    if (!isValidEmail(normalized)) {
      throw new ApiClientError(400, "Informe um e-mail válido.");
    }
    
    // Para compatibilidade, apenas define o e-mail localmente se não houver erro
    setIdentityEmail(normalized);
  }, []);

  const clearIdentity = useCallback(async () => {
    try {
      await logoutUser();
    } finally {
      setIdentityEmail(null);
      toast.success("Sessão encerrada.");
    }
  }, []);

  const handleIdentityConfirm = useCallback(async () => {
    const normalized = identityDialog.email.trim().toLowerCase();
    if (!isValidEmail(normalized)) {
      setIdentityDialog((current) => ({
        ...current,
        error: "Digite um e-mail válido para continuar.",
      }));
      return;
    }

    setIdentityLoading(true);
    try {
      await requestMagicLink({ email: normalized });
      setIdentityDialog((current) => ({ ...current, open: false, error: "" }));
      toast.success("Enviamos um link de confirmação para seu e-mail.");

      identityResolver?.(null);
    } catch {
      setIdentityDialog((current) => ({
        ...current,
        error: "Ocorreu um erro ao enviar o link.",
      }));
    } finally {
      setIdentityResolver(null);
      setIdentityLoading(false);
    }
  }, [identityDialog.email, identityResolver]);

  const handleIdentityCancel = useCallback(() => {
    setIdentityDialog((current) => ({ ...current, open: false, error: "" }));
    identityResolver?.(null);
    setIdentityResolver(null);
    setIdentityLoading(false);
  }, [identityResolver]);

  const identityDialogElement = useMemo<ReactNode>(() => (
    <Dialog open={identityDialog.open} onOpenChange={(open) => !open && handleIdentityCancel()}>
      <DialogContent className="sm:max-w-sm">
        {identityDialog.mode === "login-prompt" ? (
          <>
            <DialogHeader>
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Heart className="h-6 w-6 text-primary" />
              </div>
              <DialogTitle className="text-center">Conta necessária</DialogTitle>
              <DialogDescription className="text-center">
                {identityDialog.message}
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="flex-col gap-2 sm:flex-col">
              <Button asChild className="w-full" onClick={handleIdentityCancel}>
                <Link to="/minha-conta">Ir para login</Link>
              </Button>
              <Button variant="ghost" className="w-full" onClick={handleIdentityCancel}>
                Agora não
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Identifique-se para continuar</DialogTitle>
              <DialogDescription>{identityDialog.message}</DialogDescription>
            </DialogHeader>

            <div className="space-y-2">
              <label htmlFor="identity-email" className="text-sm font-medium">
                E-mail
              </label>
              <Input
                id="identity-email"
                autoFocus
                type="email"
                value={identityDialog.email}
                onChange={(event) =>
                  setIdentityDialog((current) => ({
                    ...current,
                    email: event.target.value,
                    error: "",
                  }))
                }
                placeholder="voce@email.com"
              />
              {identityDialog.error ? (
                <p className="text-sm text-destructive" role="alert">
                  {identityDialog.error}
                </p>
              ) : null}
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="ghost" onClick={handleIdentityCancel} disabled={identityLoading}>
                Agora não
              </Button>
              <Button onClick={() => void handleIdentityConfirm()} disabled={identityLoading}>
                {identityLoading ? "Enviando..." : "Receber link mágico"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  ), [handleIdentityCancel, handleIdentityConfirm, identityDialog, identityLoading]);

  return {
    identityEmail,
    setIdentityEmail,
    requireIdentity,
    updateIdentity,
    clearIdentity,
    identityDialogElement,
  };
}
