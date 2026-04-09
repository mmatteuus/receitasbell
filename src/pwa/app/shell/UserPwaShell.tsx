import { CSSProperties, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { PageHead } from '@/components/PageHead';
import { useAppContext } from '@/contexts/app-context';
import { PwaInstallHintIOS } from '@/pwa/components/PwaInstallHintIOS';
import { PwaUpdateBanner } from '@/pwa/components/PwaUpdateBanner';
import { usePwaSessionGate } from '@/pwa/app/shell/usePwaSessionGate';
import { usePwaChrome } from '@/pwa/app/shell/usePwaChrome';
import { resolvePwaTenantSlug } from '@/pwa/app/tenant/pwa-tenant-path';
import { buildPwaPath } from '@/pwa/app/navigation/pwa-paths';
import { savePwaRedirect } from '@/pwa/app/auth/pwa-auth-redirect';
import { PwaTopBar } from '@/pwa/app/navigation/PwaTopBar';
import { PwaBottomNav } from '@/pwa/app/navigation/PwaBottomNav';
import { trackEvent } from '@/lib/telemetry';
import { OfflineRuntimeProvider } from '@/pwa/offline/runtime/OfflineRuntimeProvider';
import { useOfflineRuntime } from '@/pwa/offline/runtime/use-offline-runtime';
import { OfflineBanner } from '@/pwa/offline/ui/OfflineBanner';
import { PendingChangesBar } from '@/pwa/offline/ui/PendingChangesBar';
import { SyncCenterSheet } from '@/pwa/offline/ui/SyncCenterSheet';
import { useOfflineStatus } from '@/pwa/offline/hooks/useOfflineStatus';

type NavigatorStandalone = Navigator & { standalone?: boolean };

export function UserPwaShell() {
  return (
    <OfflineRuntimeProvider>
      <UserPwaShellInner />
    </OfflineRuntimeProvider>
  );
}

function UserPwaShellInner() {
  const location = useLocation();
  const navigate = useNavigate();
  const { settings } = useAppContext();
  const gate = usePwaSessionGate();
  const chrome = usePwaChrome(location.pathname);
  const tenantSlug = resolvePwaTenantSlug(location.pathname);
  const { offline } = useOfflineStatus();
  const { syncCenterOpen, openSyncCenter, closeSyncCenter } = useOfflineRuntime();

  useEffect(() => {
    if (gate.status === 'unauthenticated') {
      const currentPath = `${location.pathname}${location.search}${location.hash}`;
      savePwaRedirect(currentPath);
      navigate(buildPwaPath('login', { tenantSlug }), { replace: true });
      return;
    }
  }, [gate.status, location.hash, location.pathname, location.search, navigate, tenantSlug]);

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as NavigatorStandalone).standalone === true;

    trackEvent('pwa.vitals', {
      mode: isStandalone ? 'standalone' : 'browser',
      path: location.pathname,
    });
  }, [location.pathname]);

  const headTitle = chrome.title === settings.siteName ? `${settings.siteName} App` : chrome.title;

  const shellStyle = {
    '--pwa-topbar-height': 'calc(56px + env(safe-area-inset-top, 0px))',
    '--pwa-bottomnav-height': 'calc(64px + env(safe-area-inset-bottom, 0px))',
  } as CSSProperties;

  if (gate.status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="animate-pulse text-sm font-medium text-muted-foreground">
            Carregando seus dados...
          </p>
        </div>
      </div>
    );
  }

  if (gate.status === 'offline_locked' || gate.status === 'unauthenticated') {
    return null;
  }

  return (
    <div className="relative min-h-screen bg-background" style={shellStyle}>
      <PageHead
        title={headTitle}
        description={chrome.isRoot ? settings.siteDescription : undefined}
      />
      <PwaUpdateBanner />
      <PwaTopBar title={chrome.title} showBack={chrome.showBack} tenantSlug={tenantSlug} />

      {/* Banner de rede — só quando offline E em tela que depende de dados ao vivo */}
      <OfflineBanner offline={offline} />

      {/* Barra de pendências — só quando houver itens no outbox */}
      <PendingChangesBar onOpenSyncCenter={openSyncCenter} />

      {/* Centro de sincronização */}
      <SyncCenterSheet open={syncCenterOpen} onOpenChange={(v) => (v ? openSyncCenter() : closeSyncCenter())} />

      <main
        className="mx-auto w-full max-w-md overflow-x-hidden px-4 pb-8 pt-4 sm:px-6"
        style={{
          paddingTop: 'calc(var(--pwa-topbar-height) + 1rem)',
          paddingBottom: 'calc(var(--pwa-bottomnav-height) + 1rem)',
        }}
      >
        <Outlet />
      </main>

      <PwaBottomNav tenantSlug={tenantSlug} />
      <PwaInstallHintIOS />
    </div>
  );
}
