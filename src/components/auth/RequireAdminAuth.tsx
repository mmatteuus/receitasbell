import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { buildTenantAdminPath, extractTenantSlugFromPath } from '@/lib/tenant';
import { useAppContext } from '@/contexts/app-context';

export function RequireAdminAuth({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { identityEmail, identityRole } = useAppContext();

  // Verifica se o usuário está autenticado e tem role de admin ou owner
  const isAdminAuthenticated =
    identityEmail && (identityRole === 'admin' || identityRole === 'owner');

  if (!isAdminAuthenticated) {
    const redirect = `${location.pathname}${location.search}${location.hash}`;
    const tenantSlug = extractTenantSlugFromPath(location.pathname);
    return (
      <Navigate
        to={`${buildTenantAdminPath('', tenantSlug)}?redirect=${encodeURIComponent(redirect)}`}
        replace
      />
    );
  }

  return <>{children}</>;
}
