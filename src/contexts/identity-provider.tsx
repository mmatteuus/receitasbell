import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { ApiClientError } from '@/lib/api/client';
import { fetchMe, isValidEmail, logoutUser, requestMagicLink } from '@/lib/api/identity';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Heart, LogIn } from 'lucide-react';
import { isPwaRuntimePath } from '@/pwa/offline/runtime';

type IdentityDialogState = {
  open: boolean;
  mode: 'login-prompt' | 'email-form' | 'rating-prompt' | 'favorite-prompt';
  message: string;
  email: string;
  error: string;
};

const initialDialogState: IdentityDialogState = {
  open: false,
  mode: 'login-prompt',
  message: '',
  email: '',
  error: '',
};

export function useIdentityProvider() {
  const [identityEmail, setIdentityEmail] = useState<string | null>(null);
  const [identityRole, setIdentityRole] = useState<string | null>(null);
  const [identityDialog, setIdentityDialog] = useState<IdentityDialogState>(initialDialogState);
  const [identityLoading, setIdentityLoading] = useState(false);
  const [identityResolver, setIdentityResolver] = useState<((value: string | null) => void) | null>(
    null
  );

  useEffect(() => {
    void fetchMe().then((user) => {
      if (user?.email) {
        setIdentityEmail(user.email);
        setIdentityRole(user.role || 'user');
      }
    });
  }, []);

  const requireIdentity = useCallback(
    async (
      message?: string,
      mode: 'login-prompt' | 'email-form' | 'rating-prompt' | 'favorite-prompt' = 'login-prompt'
    ) => {
      if (identityEmail) {
        return identityEmail;
      }

      if (typeof window !== 'undefined' && isPwaRuntimePath(window.location.pathname)) {
        return null;
      }

      const email = await new Promise<string | null>((resolve) => {
        setIdentityResolver(() => resolve);
        setIdentityDialog({
          open: true,
          mode,
          message: message || 'Para favoritar receitas é preciso estar conectado à sua conta.',
          email: '',
          error: '',
        });
      });

      setIdentityEmail(email);
      return email;
    },
    [identityEmail]
  );

  const updateIdentity = useCallback(async (email: string, role?: string) => {
    const normalized = email.trim().toLowerCase();
    if (!isValidEmail(normalized)) {
      throw new ApiClientError(400, 'Informe um e-mail válido.');
    }

    // Para compatibilidade, apenas define o e-mail localmente se não houver erro
    setIdentityEmail(normalized);
    setIdentityRole(role || 'user');
  }, []);

  const clearIdentity = useCallback(async () => {
    try {
      await logoutUser();
    } finally {
      setIdentityEmail(null);
      setIdentityRole(null);
      toast.success('Sessão encerrada.');
    }
  }, []);

  const handleIdentityConfirm = useCallback(async () => {
    const normalized = identityDialog.email.trim().toLowerCase();
    if (!isValidEmail(normalized)) {
      setIdentityDialog((current) => ({
        ...current,
        error: 'Digite um e-mail válido para continuar.',
      }));
      return;
    }

    setIdentityLoading(true);
    try {
      await requestMagicLink({ email: normalized });
      setIdentityDialog((current) => ({ ...current, open: false, error: '' }));
      toast.success('Enviamos um link de confirmação para seu e-mail.');

      identityResolver?.(null);
    } catch {
      setIdentityDialog((current) => ({
        ...current,
        error: 'Ocorreu um erro ao enviar o link.',
      }));
    } finally {
      setIdentityResolver(null);
      setIdentityLoading(false);
    }
  }, [identityDialog.email, identityResolver]);

  const handleIdentityCancel = useCallback(() => {
    setIdentityDialog((current) => ({ ...current, open: false, error: '' }));
    identityResolver?.(null);
    setIdentityResolver(null);
    setIdentityLoading(false);
  }, [identityResolver]);

  const identityDialogElement = useMemo<ReactNode>(
    () => (
      <Dialog open={identityDialog.open} onOpenChange={(open) => !open && handleIdentityCancel()}>
        <DialogContent className="sm:max-w-md">
          {identityDialog.mode === 'rating-prompt' ? (
            <>
              <DialogHeader>
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
                  <span className="text-3xl">⭐</span>
                </div>
                <DialogTitle className="text-center text-xl">Fazer Avaliação</DialogTitle>
                <DialogDescription className="text-center pt-2">
                  Para avaliar esta receita, você precisa estar conectado à sua conta.
                </DialogDescription>
              </DialogHeader>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 my-4">
                <p className="text-sm text-blue-900 font-medium mb-2">👤 Por que é necessário?</p>
                <p className="text-xs text-blue-800 leading-relaxed">
                  Cada avaliação fica associada à sua conta, permitindo que você veja suas
                  avaliações posteriormente e ajudando a comunidade a ter avaliações autênticas.
                </p>
              </div>

              <DialogFooter className="flex-col gap-2 sm:flex-col pt-4">
                <Button asChild className="w-full bg-primary hover:bg-primary/90 gap-2">
                  <Link to="/minha-conta">
                    <LogIn className="h-4 w-4" />
                    Fazer Login
                  </Link>
                </Button>
                <Button variant="outline" className="w-full" onClick={handleIdentityCancel}>
                  Agora Não
                </Button>
              </DialogFooter>
            </>
          ) : identityDialog.mode === 'favorite-prompt' ? (
            <>
              <DialogHeader>
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                  <span className="text-3xl">❤️</span>
                </div>
                <DialogTitle className="text-center text-xl">Salvar Receita</DialogTitle>
                <DialogDescription className="text-center pt-2">
                  Para salvar esta receita, você precisa estar conectado à sua conta.
                </DialogDescription>
              </DialogHeader>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4 my-4">
                <p className="text-sm text-green-900 font-medium mb-2">📚 Organize suas receitas</p>
                <p className="text-xs text-green-800 leading-relaxed">
                  Ao salvar, você poderá acessar suas receitas favoritas em qualquer momento e criar
                  uma coleção pessoal das suas receitas preferidas.
                </p>
              </div>

              <DialogFooter className="flex-col gap-2 sm:flex-col pt-4">
                <Button asChild className="w-full bg-primary hover:bg-primary/90 gap-2">
                  <Link to="/minha-conta">
                    <LogIn className="h-4 w-4" />
                    Fazer Login
                  </Link>
                </Button>
                <Button variant="outline" className="w-full" onClick={handleIdentityCancel}>
                  Agora Não
                </Button>
              </DialogFooter>
            </>
          ) : identityDialog.mode === 'login-prompt' ? (
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
                      error: '',
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
                  {identityLoading ? 'Enviando...' : 'Receber link mágico'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    ),
    [handleIdentityCancel, handleIdentityConfirm, identityDialog, identityLoading]
  );

  return {
    identityEmail,
    identityRole,
    setIdentityEmail,
    setIdentityRole,
    requireIdentity,
    updateIdentity,
    clearIdentity,
    identityDialogElement,
  };
}
