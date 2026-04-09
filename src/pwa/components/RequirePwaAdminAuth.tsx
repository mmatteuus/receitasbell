import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { resolvePwaTenantSlug } from '@/pwa/app/tenant/pwa-tenant-path';
import { buildPwaPath } from '@/pwa/app/navigation/pwa-paths';
import { useAppContext } from '@/contexts/app-context';

export function RequirePwaAdminAuth({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { identityEmail, identityRole } = useAppContext();
  const tenantSlug = resolvePwaTenantSlug(location.pathname);

  // Verifica se o usuário está autenticado e tem role de admin ou owner
  const isAdminAuthenticated =
    identityEmail && (identityRole === 'admin' || identityRole === 'owner');

  if (!isAdminAuthenticated) {
    // Redireciona para a página de entrada (que por sua vez redireciona para login se necessário)
    return <Navigate to={buildPwaPath('login', { tenantSlug })} replace />;
  }

  return <>{children}</>;
}
