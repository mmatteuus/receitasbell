import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PageHead } from '@/components/PageHead';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChefHat, Loader2, Lock, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { updatePassword, fetchMe } from '@/lib/api/identity';
import { buildPwaPath } from '@/pwa/app/navigation/pwa-paths';
import { resolvePwaTenantSlug } from '@/pwa/app/tenant/pwa-tenant-path';
import { supabase } from '@/lib/supabase'; // Assuming this is the client-side supabase client

export default function UpdatePasswordPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);

  const tenantSlug = resolvePwaTenantSlug(location.pathname);

  useEffect(() => {
    // Verificar se o usuário está vindo de um link de recuperação
    // O Supabase preenche a sessão automaticamente a partir do hash #access_token=...
    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      // Se não houver sessão, e não estiver logado no nosso sistema, redirecionar para login
      if (!session) {
        const me = await fetchMe({ allowOffline: false });
        if (!me) {
          toast.error('Link de recuperação inválido ou expirado.');
          navigate(buildPwaPath('login', { tenantSlug }));
          return;
        }
      }
      setIsVerifying(false);
    }

    checkSession();
  }, [navigate, tenantSlug]);

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('As senhas não coincidem.');
      return;
    }
    if (password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setLoading(true);
    try {
      // 1. Atualizar no Supabase Auth (lado do cliente)
      // Isso funciona se o usuário tiver a sessão do link de recuperação ativa
      const { error: supabaseError } = await supabase.auth.updateUser({ password });
      if (supabaseError) throw supabaseError;

      // 2. Opcional: Notificar nosso backend para sincronizar qualquer estado se necessário
      // (Nosso update-password handler usa a Session Cookie, que pode não estar ativa se for só link de recuperação)
      // Mas o fetchMe vai criar a sessão se o Supabase estiver logado.
      await fetchMe({ allowOffline: false });

      setSuccess(true);
      toast.success('Senha atualizada com sucesso!');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar senha.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  if (isVerifying) {
    return (
      <>
        <PageHead title="Validando link" noindex />
        <div className="flex min-h-screen items-center justify-center bg-background p-6">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </>
    );
  }

  if (success) {
    return (
      <>
        <PageHead title="Senha alterada" noindex />
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
          <Card className="w-full max-w-sm border-none shadow-none bg-transparent text-center">
            <CardHeader className="space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <CardTitle className="text-2xl font-bold">Senha Alterada</CardTitle>
              <CardDescription>
                Sua senha foi atualizada com sucesso. Você já pode acessar sua conta.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full h-12"
                onClick={() => navigate(buildPwaPath('home', { tenantSlug }))}
              >
                Ir para o App
              </Button>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHead title="Nova senha" noindex />
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
            <ChefHat className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Nova Senha</h1>
        </div>

        <Card className="w-full max-w-sm border-none shadow-none bg-transparent">
          <CardHeader className="px-0 text-center">
            <CardDescription>Crie uma nova senha segura para sua conta.</CardDescription>
          </CardHeader>
          <CardContent className="px-0 pt-4">
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder="Nova senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12"
                />
                <Input
                  type="password"
                  placeholder="Confirme a nova senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="h-12"
                />
              </div>

              <Button type="submit" className="w-full h-12 text-base gap-2" disabled={loading}>
                {loading ? (
                  <Loader2 className="animate-spin h-5 w-5" />
                ) : (
                  <>
                    <Lock className="h-5 w-5" />
                    Salvar Senha
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
