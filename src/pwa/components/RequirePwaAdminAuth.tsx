import { useEffect, useState, type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { resolvePwaTenantSlug } from '@/pwa/app/tenant/pwa-tenant-path';
import { buildPwaPath } from '@/pwa/app/navigation/pwa-paths';
import { useAppContext } from '@/contexts/app-context';
import { getOfflineAdminSession } from '@/pwa/offline/auth/offline-auth';

type AuthState = 'loading' | 'allowed' | 'denied';

export function RequirePwaAdminAuth({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { identityEmail, identityRole } = useAppContext();
  const tenantSlug = resolvePwaTenantSlug(location.pathname);
  const [authState, setAuthState] = useState<AuthState>('loading');

  useEffect(() => {
    const onlineAdminOk =
      identityEmail && (identityRole === 'admin' || identityRole === 'owner');

    if (onlineAdminOk) {
      setAuthState('allowed');
      return;
    }

    // Online sem role admin: não há chance offline
    if (identityEmail && identityRole && identityRole !== 'admin' && identityRole !== 'owner') {
      setAuthState('denied');
      return;
    }

    // Sem role (pode ser offline) — tentar envelope admin
    void getOfflineAdminSession()
      .then((session) => {
        setAuthState(session ? 'allowed' : 'denied');
      })
      .catch(() => {
        setAuthState('denied');
      });
  }, [identityEmail, identityRole]);

  if (authState === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (authState === 'denied') {
    return <Navigate to={buildPwaPath('login', { tenantSlug })} replace />;
  }

  return <>{children}</>;
}
