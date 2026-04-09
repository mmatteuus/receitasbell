import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PageHead } from '@/components/PageHead';
import { fetchMe } from '@/lib/api/identity';
import { getInstallContext } from '../lib/install-context';
import { buildPwaAdminPath, buildPwaPath } from '@/pwa/app/navigation/pwa-paths';
import { clearPwaRedirect, readPwaRedirect } from '@/pwa/app/auth/pwa-auth-redirect';
import { resolvePwaTenantSlug } from '@/pwa/app/tenant/pwa-tenant-path';
import { useAppContext } from '@/contexts/app-context';

export default function PwaEntryPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { identityEmail, identityRole } = useAppContext();

  useEffect(() => {
    let active = true;

    async function run() {
      const tenantSlug = resolvePwaTenantSlug(location.pathname);
      const installContext = getInstallContext();
      const pendingRedirect = readPwaRedirect();

      try {
        // Verifica se é admin pelo contexto
        if (identityEmail && (identityRole === 'admin' || identityRole === 'owner')) {
          navigate(buildPwaAdminPath({ tenantSlug }), { replace: true });
          return;
        }

        // Se há identity email, redireciona para home
        if (identityEmail) {
          const target = pendingRedirect || buildPwaPath('home', { tenantSlug });
          clearPwaRedirect();
          navigate(target, { replace: true });
          return;
        }
      } catch {
        if (!active) {
          return;
        }
      }

      if (!active) {
        return;
      }

      // Não autenticado: vai para a tela de login unificada
      navigate(buildPwaPath('login', { tenantSlug }), { replace: true });
    }

    void run();

    return () => {
      active = false;
    };
  }, [location.pathname, navigate, identityEmail, identityRole]);

  return (
    <>
      <PageHead title="Abrindo o app" noindex />
      <div className="flex h-screen items-center justify-center bg-background p-6 text-center">
        <div className="flex flex-col items-center gap-4 animate-in fade-in duration-500">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm font-medium text-muted-foreground tracking-tight">
            Iniciando Receitas Bell...
          </p>
        </div>
      </div>
    </>
  );
}
