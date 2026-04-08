import { CSSProperties, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { PageHead } from '@/components/PageHead';
import { useAppContext } from '@/contexts/app-context';
import { PwaInstallHintIOS } from '@/pwa/components/PwaInstallHintIOS';
import { PwaUpdateBanner } from '@/pwa/components/PwaUpdateBanner';
import { usePwaSessionGate } from '@/pwa/app/shell/usePwaSessionGate';
import { usePwaChrome } from '@/pwa/app/shell/usePwaChrome';
import { resolvePwaTenantSlug } from '@/pwa/app/tenant/pwa-tenant-path';
import { PwaTopBar } from '@/pwa/app/navigation/PwaTopBar';
import { PwaBottomNav } from '@/pwa/app/navigation/PwaBottomNav';
import { trackEvent } from '@/lib/telemetry';

type NavigatorStandalone = Navigator & { standalone?: boolean };

export function UserPwaShell() {
  const location = useLocation();
  const { settings } = useAppContext();
  const gate = usePwaSessionGate();
  const chrome = usePwaChrome(location.pathname);
  const tenantSlug = resolvePwaTenantSlug(location.pathname);

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

  if (gate.status === 'offline_locked') {
    // Phase is online only - no offline locked screen shown
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
