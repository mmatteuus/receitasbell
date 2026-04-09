import { useEffect, useState, useCallback } from 'react';

interface UpdateNotification {
  isAvailable: boolean;
  isWaiting: boolean;
}

const FIVE_DAYS_IN_MS = 5 * 24 * 60 * 60 * 1000; // 5 dias em milissegundos
const LAST_UPDATE_CHECK_KEY = 'pwa_last_update_check';

/**
 * Hook para monitorar e gerenciar atualizações do Service Worker do PWA
 * Detecta quando uma nova versão está disponível e permite ao usuário atualizar
 * Verificação de updates a cada 5 dias
 */
export function useServiceWorkerUpdate() {
  const [updateNotification, setUpdateNotification] = useState<UpdateNotification>({
    isAvailable: false,
    isWaiting: false,
  });

  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  /**
   * Verifica se é hora de fazer uma nova verificação de atualizações
   */
  const shouldCheckForUpdates = (): boolean => {
    try {
      const lastCheck = localStorage.getItem(LAST_UPDATE_CHECK_KEY);
      if (!lastCheck) return true;

      const lastCheckTime = parseInt(lastCheck, 10);
      const now = Date.now();
      const timeSinceLastCheck = now - lastCheckTime;

      return timeSinceLastCheck >= FIVE_DAYS_IN_MS;
    } catch {
      // Se houver erro ao acessar localStorage, permitir verificação
      return true;
    }
  };

  /**
   * Registra o timestamp da última verificação
   */
  const recordUpdateCheck = (): void => {
    try {
      localStorage.setItem(LAST_UPDATE_CHECK_KEY, Date.now().toString());
    } catch {
      // Silenciosamente falha se localStorage não estiver disponível
    }
  };

  useEffect(() => {
    // Verificar se o navegador suporta Service Workers
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Workers não são suportados neste navegador');
      return;
    }

    let swRegistration: ServiceWorkerRegistration | null = null;

    // Função para lidar com atualizações disponíveis
    const onServiceWorkerUpdate = (registration: ServiceWorkerRegistration) => {
      // Quando há um service worker em espera (waiting), significa que uma atualização está disponível
      if (registration.waiting) {
        setUpdateNotification({
          isAvailable: true,
          isWaiting: true,
        });
      }
    };

    // Monitorar mudanças no ciclo de vida do Service Worker
    const monitorServiceWorker = async () => {
      try {
        swRegistration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });

        setRegistration(swRegistration);

        // Verificar se já existe um SW em waiting (nova atualização disponível)
        if (swRegistration.waiting) {
          onServiceWorkerUpdate(swRegistration);
        }

        // Monitorar futuros updates
        swRegistration.addEventListener('updatefound', () => {
          const newWorker = swRegistration!.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // Nova versão está instalada e pronta para usar
                onServiceWorkerUpdate(swRegistration!);
              }
            });
          }
        });

        // Verificar por atualizações a cada 5 dias
        // Primeira verificação é feita imediatamente se passou 5 dias
        if (shouldCheckForUpdates()) {
          swRegistration.update();
          recordUpdateCheck();
        }

        // Intervalo de 5 dias para verificações subsequentes
        const interval = setInterval(() => {
          if (shouldCheckForUpdates()) {
            swRegistration?.update();
            recordUpdateCheck();
            console.log('PWA: Verificando por atualizações...');
          }
        }, FIVE_DAYS_IN_MS);

        return () => clearInterval(interval);
      } catch (error) {
        console.error('Erro ao registrar Service Worker:', error);
      }
    };

    const cleanup = monitorServiceWorker();
    return () => {
      cleanup?.then((fn) => fn?.());
    };
  }, []);

  /**
   * Aplica a atualização do Service Worker
   * Isso causará uma recarga da página com a nova versão
   */
  const applyUpdate = useCallback(() => {
    if (registration?.waiting) {
      // Enviar mensagem para o SW em waiting tomar controle
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });

      // Aguardar até que o SW controlando mude
      let isRefreshed = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!isRefreshed) {
          isRefreshed = true;
          window.location.reload();
        }
      });
    }
  }, [registration]);

  /**
   * Descarta a atualização e continua com a versão atual
   */
  const dismissUpdate = useCallback(() => {
    setUpdateNotification({
      isAvailable: false,
      isWaiting: false,
    });
  }, []);

  return {
    updateNotification,
    applyUpdate,
    dismissUpdate,
    registration,
  };
}
