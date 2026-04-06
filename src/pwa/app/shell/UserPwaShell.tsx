import { CSSProperties, useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { PageHead } from '@/components/PageHead';
import { useAppContext } from '@/contexts/app-context';
import { OfflineLockedScreen } from '@/pwa/offline/ui/OfflineLockedScreen';
import { OfflineBanner } from '@/pwa/offline/ui/OfflineBanner';
import { PendingChangesBar } from '@/pwa/offline/ui/PendingChangesBar';
import { SyncCenterSheet } from '@/pwa/offline/ui/SyncCenterSheet';
import { ConflictResolutionDialog } from '@/pwa/offline/ui/ConflictResolutionDialog';
import { PwaInstallHintIOS } from '@/pwa/components/PwaInstallHintIOS';
import { PwaUpdateBanner } from '@/pwa/components/PwaUpdateBanner';
import { useConflictCenter } from '@/pwa/offline/hooks/useConflictCenter';
import { useOfflineStatus } from '@/pwa/offline/hooks/useOfflineStatus';
import { usePendingSyncCount } from '@/pwa/offline/hooks/usePendingSyncCount';
import { usePwaSessionGate } from '@/pwa/app/shell/usePwaSessionGate';
import { usePwaChrome } from '@/pwa/app/shell/usePwaChrome';
import { resolvePwaTenantSlug } from '@/pwa/app/tenant/pwa-tenant-path';
import { buildPwaPath } from '@/pwa/app/navigation/pwa-paths';
import { savePwaRedirect } from '@/pwa/app/auth/pwa-auth-redirect';
import { PwaTopBar } from '@/pwa/app/navigation/PwaTopBar';
import { PwaBottomNav } from '@/pwa/app/navigation/PwaBottomNav';
import { trackEvent } from '@/lib/telemetry';

type NavigatorStandalone = Navigator & { standalone?: boolean };

const OFFLINE_BANNER_HEIGHT = 40;
const PENDING_BAR_HEIGHT = 44;

export function UserPwaShell() {
  const [syncCenterOpen, setSyncCenterOpen] = useState(false);
  const [conflictDialogOpen, setConflictDialogOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { settings } = useAppContext();
  const gate = usePwaSessionGate();
  const chrome = usePwaChrome(location.pathname);
  const tenantSlug = resolvePwaTenantSlug(location.pathname);
  const { conflicts } = useConflictCenter();
  const { offline } = useOfflineStatus();
  const pendingCount = usePendingSyncCount();

  useEffect(() => {
    if (conflicts.length > 0) {
      setConflictDialogOpen(true);
    }
  }, [conflicts.length]);

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as NavigatorStandalone).standalone === true;

    trackEvent('pwa.vitals', {
      mode: isStandalone ? 'standalone' : 'browser',
      path: location.pathname,
    });
  }, [location.pathname]);

  useEffect(() => {
    if (gate.status !== 'unauthenticated') {
      return;
    }

    const currentPath = `${location.pathname}${location.search}${location.hash}`;
    savePwaRedirect(currentPath);
    navigate(buildPwaPath('login', { tenantSlug }), {
      replace: true,
    });
  }, [gate.status, location.hash, location.pathname, location.search, navigate, tenantSlug]);

  const offlineBannerHeight = offline ? OFFLINE_BANNER_HEIGHT : 0;
  const pendingBannerHeight = pendingCount > 0 ? PENDING_BAR_HEIGHT : 0;
  const bannerOffset = offlineBannerHeight + pendingBannerHeight;
  const loginPath = buildPwaPath('login', { tenantSlug });
  const headTitle = chrome.title === settings.siteName ? `${settings.siteName} App` : chrome.title;

  const shellStyle = {
    '--pwa-topbar-height': 'calc(56px + env(safe-area-inset-top, 0px))',
    '--pwa-bottomnav-height': 'calc(64px + env(safe-area-inset-bottom, 0px))',
    '--pwa-offline-banner-height': `${offlineBannerHeight}px`,
    '--pwa-banner-offset': `${bannerOffset}px`,
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

  if (gate.status === 'offline_locked') {
    return (
      <OfflineLockedScreen
        title="Conecte-se uma vez para liberar o modo offline"
        description="Este dispositivo ainda não possui sessão e snapshot válidos para abrir o app sem internet."
        ctaHref={loginPath}
        ctaLabel="Ir para o login"
      />
    );
  }

  if (gate.status === 'unauthenticated') {
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
      <OfflineBanner offline={offline} />
      <PendingChangesBar
        pendingCount={pendingCount}
        onOpenSyncCenter={() => setSyncCenterOpen(true)}
      />

      <main
        className="mx-auto w-full max-w-md overflow-x-hidden px-4 pb-8 pt-4 sm:px-6"
        style={{
          paddingTop: 'calc(var(--pwa-topbar-height) + var(--pwa-banner-offset) + 1rem)',
          paddingBottom: 'calc(var(--pwa-bottomnav-height) + 1rem)',
        }}
      >
        <Outlet />
      </main>

      <PwaBottomNav tenantSlug={tenantSlug} />
      <PwaInstallHintIOS />
      <SyncCenterSheet open={syncCenterOpen} onOpenChange={setSyncCenterOpen} />
      <ConflictResolutionDialog open={conflictDialogOpen} onOpenChange={setConflictDialogOpen} />
    </div>
  );
}
