import { useEffect } from 'react';
import { useServiceWorkerUpdate } from '@/hooks/useServiceWorkerUpdate';
import { toast } from 'sonner';

/**
 * Componente que monitora atualizações do PWA e notifica o usuário
 * Quando uma atualização está disponível, exibe uma notificação com opção de atualizar
 */
export function PWAUpdateHandler() {
  const { updateNotification, applyUpdate, dismissUpdate } = useServiceWorkerUpdate();

  useEffect(() => {
    if (updateNotification.isAvailable && updateNotification.isWaiting) {
      // Exibir notificação de atualização disponível
      toast.success('Atualização disponível!', {
        description: 'Uma nova versão da aplicação foi baixada. Clique para atualizar agora.',
        duration: Infinity, // Manter a notificação até o usuário agir
        action: {
          label: 'Atualizar agora',
          onClick: () => {
            applyUpdate();
          },
        },
        cancel: {
          label: 'Agora não',
          onClick: () => {
            dismissUpdate();
          },
        },
      });
    }
  }, [updateNotification.isAvailable, updateNotification.isWaiting, applyUpdate, dismissUpdate]);

  // Este componente não renderiza nada visualmente
  // A notificação é gerenciada pelo toast do Sonner
  return null;
}
