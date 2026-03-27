import { useState, useEffect } from "react";
import { useInstallPrompt } from "../hooks/useInstallPrompt";
import { Share, PlusSquare, X } from "lucide-react";
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
      <div className="mx-auto max-w-sm rounded-2xl bg-card p-4 shadow-2xl border border-border">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
               <Share className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold tracking-tight">Instalar Receitas Bell</h3>
              <p className="text-xs text-muted-foreground leading-snug">
                Adicione à tela de início para uma melhor experiência.
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="-mt-1 -mr-1 h-8 w-8" onClick={handleDismiss}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="mt-4 flex flex-col gap-3 rounded-lg bg-muted/50 p-3">
          <div className="flex items-center gap-3 text-xs">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-background border border-border">
               <Share className="h-4 w-4" />
            </div>
            <span>1. Toque no botão "Compartilhar" abaixo</span>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-background border border-border">
               <PlusSquare className="h-4 w-4" />
            </div>
            <span>2. Selecione "Adicionar à Tela de Início"</span>
          </div>
        </div>
      </div>
    </div>
  );
}
