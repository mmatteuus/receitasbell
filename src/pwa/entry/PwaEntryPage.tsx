import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PageHead } from '@/components/PageHead';
import { getAdminSession } from '@/lib/api/adminSession';
import { fetchMe } from '@/lib/api/identity';
import { getInstallContext } from '../lib/install-context';
import { buildPwaAdminPath, buildPwaPath } from '@/pwa/app/navigation/pwa-paths';
import { clearPwaRedirect, readPwaRedirect } from '@/pwa/app/auth/pwa-auth-redirect';
import { resolvePwaTenantSlug } from '@/pwa/app/tenant/pwa-tenant-path';

export default function PwaEntryPage() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let active = true;

    async function run() {
      const tenantSlug = resolvePwaTenantSlug(location.pathname);
      const installContext = getInstallContext();
      const pendingRedirect = readPwaRedirect();

      try {
        const [adminSession, userSession] = await Promise.all([
          getAdminSession({ allowOffline: true }).catch(() => ({
            authenticated: false as const,
          })),
          fetchMe({ allowOffline: true }),
        ]);

        if (!active) {
          return;
        }

        if (adminSession.authenticated) {
          navigate(buildPwaAdminPath({ tenantSlug }), { replace: true });
          return;
        }

        if (userSession?.email) {
          const target =
            pendingRedirect ||
            buildPwaPath('home', { tenantSlug: userSession.tenantSlug ?? tenantSlug });
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

      if (installContext === 'admin') {
        navigate(buildPwaPath('adminLogin', { tenantSlug }), { replace: true });
        return;
      }

      navigate(buildPwaPath('login', { tenantSlug }), { replace: true });
    }

    void run();

    return () => {
      active = false;
    };
  }, [location.pathname, navigate]);

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
