import { useEffect, useState, useCallback } from 'react';

interface UpdateNotification {
  isAvailable: boolean;
  isWaiting: boolean;
}

/**
 * Hook para monitorar e gerenciar atualizações do Service Worker do PWA
 * Detecta quando uma nova versão está disponível e permite ao usuário atualizar
 */
export function useServiceWorkerUpdate() {
  const [updateNotification, setUpdateNotification] = useState<UpdateNotification>({
    isAvailable: false,
    isWaiting: false,
  });

  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

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

        // Verificar por atualizações a cada minuto
        const interval = setInterval(() => {
          swRegistration?.update();
        }, 60 * 1000);

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
