import { useState, useEffect } from 'react';
import { getCurrentTenantSlug } from '@/lib/tenant';
import { setInstallContext, type InstallContext } from '../lib/install-context';
import { trackEvent } from '@/lib/telemetry';
import { toast } from 'sonner';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

type NavigatorStandalone = Navigator & { standalone?: boolean };
type WindowWithMSStream = Window & { MSStream?: unknown };

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      trackEvent('pwa.install_prompt_ready', {
        tenantSlug: getCurrentTenantSlug(),
        platform: window.navigator.userAgent,
      });
    };

    const installedHandler = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      trackEvent('pwa.installed', {
        tenantSlug: getCurrentTenantSlug(),
        platform: window.navigator.userAgent,
      });
      try {
        localStorage.setItem('lastPwaInstallDate', new Date().toISOString());
      } catch (error) {
        console.warn('Failed to persist lastPwaInstallDate', error);
      }
      toast.success('App instalado! Acesse pelo ícone na tela inicial.');
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', installedHandler);

    // Initial check for standalone mode
    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as NavigatorStandalone).standalone === true
    ) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installedHandler);
    };
  }, []);

  const install = async (context: InstallContext) => {
    if (!deferredPrompt) return;

    trackEvent('pwa.install_cta_clicked', {
      context,
      tenantSlug: getCurrentTenantSlug(),
    });
    setInstallContext(context, getCurrentTenantSlug());
    deferredPrompt.prompt();
    trackEvent('pwa.install_prompt_shown', {
      context,
      tenantSlug: getCurrentTenantSlug(),
    });

    const { outcome } = await deferredPrompt.userChoice;
    trackEvent(outcome === 'accepted' ? 'pwa.install_accepted' : 'pwa.install_dismissed', {
      context,
      tenantSlug: getCurrentTenantSlug(),
    });
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const isIOS = () => {
    const ua = window.navigator.userAgent;
    return /iPad|iPhone|iPod/.test(ua) && !(window as WindowWithMSStream).MSStream;
  };

  const isMobile = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  };

  return {
    deferredPrompt,
    isInstalled,
    install,
    isIOS: isIOS(),
    isMobile: isMobile(),
  };
}
