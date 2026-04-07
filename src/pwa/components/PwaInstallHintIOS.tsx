import { useState, useEffect } from "react";
import { useInstallPrompt } from "../hooks/useInstallPrompt";
import { Share, Smartphone, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PwaInstallHintIOS() {
  const { isIOS, isInstalled } = useInstallPrompt();
  const [show, setShow] = useState(false);

  useEffect(() => {
    // If iOS and not installed, show a helper toast/hint
    if (isIOS && !isInstalled) {
      // Don't show immediately, maybe wait a bit or track if dismissed
      const dismissed = localStorage.getItem('ios-pwa-hint-dismissed');
      if (!dismissed) {
        const timer = setTimeout(() => setShow(true), 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [isIOS, isInstalled]);

  if (!show) return null;

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem('ios-pwa-hint-dismissed', 'true');
  };

  return (
    <div className="fixed bottom-0 inset-x-0 p-4 z-50 animate-in slide-in-from-bottom duration-500">
      <div className="mx-auto max-w-sm rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 p-4 shadow-2xl border-2 border-primary/30">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground flex-shrink-0">
               <Smartphone className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold tracking-tight text-foreground">Instale o app Receitas Bell</h3>
              <p className="text-xs text-muted-foreground leading-snug mt-0.5">
                Acesse suas receitas offline, carregamento mais rápido e notificações.
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="-mt-1 -mr-1 h-8 w-8 flex-shrink-0" onClick={handleDismiss}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-4 flex flex-col gap-2.5 rounded-lg bg-white/40 dark:bg-black/20 p-3 border border-primary/20">
          <div className="flex items-center gap-2.5 text-xs">
            <div className="flex h-5 w-5 items-center justify-center rounded bg-primary/20 text-primary flex-shrink-0 font-bold">1</div>
            <span className="text-foreground">Toque em Compartilhar abaixo</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs">
            <div className="flex h-5 w-5 items-center justify-center rounded bg-primary/20 text-primary flex-shrink-0 font-bold">2</div>
            <span className="text-foreground">Selecione "Adicionar à Tela de Início"</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs">
            <div className="flex h-5 w-5 items-center justify-center rounded bg-primary/20 text-primary flex-shrink-0 font-bold">3</div>
            <span className="text-foreground">Pronto! Acesse do seu home screen</span>
          </div>
        </div>
      </div>
    </div>
  );
}
