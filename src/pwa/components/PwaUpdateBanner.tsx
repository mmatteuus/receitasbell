import { useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Button } from '@/components/ui/button';
import { RefreshCw, X } from 'lucide-react';
import { toast } from 'sonner';

export function PwaUpdateBanner() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ', r);
    },
    onRegisterError(error) {
      console.error('SW registration error', error);
    },
  });

  const close = () => {
    setNeedRefresh(false);
  };

  useEffect(() => {
    if (needRefresh) {
      toast.info("Nova versão disponível!", {
        description: "Atualize para aproveitar as melhorias mais recentes.",
        action: {
          label: "Atualizar",
          onClick: () => updateServiceWorker(true),
        },
        duration: Infinity,
        position: 'top-center'
      });
    }
  }, [needRefresh, updateServiceWorker]);

  if (!needRefresh) return null;

  return (
    <div className="fixed top-4 inset-x-4 z-[100] animate-in fade-in slide-in-from-top-4 duration-500 md:hidden">
      <div className="mx-auto max-w-sm rounded-xl bg-primary text-primary-foreground p-4 shadow-2xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20">
            <RefreshCw className="h-5 w-5 animate-spin-slow" />
          </div>
          <div>
            <p className="text-sm font-bold tracking-tight">Nova versão pronta!</p>
            <p className="text-xs opacity-90 leading-tight">Clique para atualizar agora.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            variant="secondary" 
            className="h-9 px-4 font-semibold text-primary" 
            onClick={() => updateServiceWorker(true)}
          >
            Atualizar
          </Button>
          <Button 
            size="icon" 
            variant="ghost" 
            className="h-8 w-8 hover:bg-white/10" 
            onClick={close}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
