import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PageHead } from '@/components/PageHead';
import { getAdminSession } from '@/lib/api/adminSession';
import { setInstallContext } from '../lib/install-context';
import { buildPwaAdminPath, buildPwaPath } from '@/pwa/app/navigation/pwa-paths';
import { resolvePwaTenantSlug } from '@/pwa/app/tenant/pwa-tenant-path';

export default function PwaAdminEntryPage() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Admin agora faz login na página de conta normal (Minha Conta)
    // Esta página redireciona para a entrada do painel admin se já autenticado
    setInstallContext('admin');

    let active = true;

    async function run() {
      const tenantSlug = resolvePwaTenantSlug(location.pathname);

      try {
        const adminSession = await getAdminSession({ allowOffline: true }).catch(() => ({
          authenticated: false as const,
        }));

        if (!active) return;

        if (adminSession.authenticated) {
          navigate(buildPwaAdminPath({ tenantSlug }), { replace: true });
          return;
        }
      } catch {
        if (!active) return;
      }

      if (!active) return;

      // Redireciona para a página de login normal (Minha Conta)
      navigate(buildPwaPath('login', { tenantSlug }), { replace: true });
    }

    void run();

    return () => {
      active = false;
    };
  }, [location.pathname, navigate]);

  return (
    <>
      <PageHead title="Abrindo painel admin" noindex />
      <div className="flex h-screen items-center justify-center bg-background p-6 text-center">
        <div className="flex flex-col items-center gap-4 animate-in fade-in duration-500">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm font-medium text-muted-foreground tracking-tight">
            Iniciando painel admin...
          </p>
        </div>
      </div>
    </>
  );
}
