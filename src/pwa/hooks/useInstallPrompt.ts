import { useState, useEffect, useRef } from 'react';
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
  const isProcessingRef = useRef(false);

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
      isProcessingRef.current = false;
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
    // Previne múltiplas chamadas simultâneas
    if (isProcessingRef.current || !deferredPrompt) return;

    isProcessingRef.current = true;

    try {
      trackEvent('pwa.install_cta_clicked', {
        context,
        tenantSlug: getCurrentTenantSlug(),
      });
      setInstallContext(context, getCurrentTenantSlug());

      // Aguarda o prompt ser exibido
      await deferredPrompt.prompt();

      trackEvent('pwa.install_prompt_shown', {
        context,
        tenantSlug: getCurrentTenantSlug(),
      });

      // Aguarda a escolha do usuário
      const { outcome } = await deferredPrompt.userChoice;

      trackEvent(outcome === 'accepted' ? 'pwa.install_accepted' : 'pwa.install_dismissed', {
        context,
        tenantSlug: getCurrentTenantSlug(),
      });

      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      } else {
        // Usuário recusou - permitir tentar novamente
        isProcessingRef.current = false;
      }
    } catch (error) {
      console.error('Erro ao disparar prompt de instalação:', error);
      isProcessingRef.current = false;
      // Não quebra a experiência
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
