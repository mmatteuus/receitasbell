import { useEffect, useState } from 'react';
import { trackEvent } from '@/lib/telemetry';
import { getCurrentTenantSlug } from '@/lib/tenant';

type NavigatorStandalone = Navigator & { standalone?: boolean };
type WindowWithMSStream = Window & { MSStream?: unknown };

export function usePwaState() {
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isPwaSupported, setIsPwaSupported] = useState(false);
  const [isServiceWorkerReady, setIsServiceWorkerReady] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const supportsServiceWorker = 'serviceWorker' in navigator;
    setIsPwaSupported(supportsServiceWorker);
    if (supportsServiceWorker) {
      navigator.serviceWorker.ready
        .then((registration) => {
          setIsServiceWorkerReady(true);
          trackEvent('pwa.service_worker_ready', {
            scope: registration.scope,
            tenantSlug: getCurrentTenantSlug(),
          });
        })
        .catch((error) => {
          trackEvent('pwa.service_worker_ready_failed', {
            tenantSlug: getCurrentTenantSlug(),
            message: error instanceof Error ? error.message : String(error),
          });
        });
    }

    const ua = window.navigator.userAgent;
    const isIosDevice = /iPad|iPhone|iPod/.test(ua) && !(window as WindowWithMSStream).MSStream;
    setIsIOS(isIosDevice);
    setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua));

    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      ((window.navigator as NavigatorStandalone).standalone ?? false);

    if (standalone) {
      setIsInstalled(true);
    }

    const handleBeforeInstall = () => {
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  return {
    isInstallable,
    isInstalled,
    isPwaSupported,
    isServiceWorkerReady,
    isIOS,
    isMobile,
  };
}
