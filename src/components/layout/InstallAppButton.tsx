import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { toast } from 'sonner';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

interface InstallAppButtonProps {
  className?: string;
  showLabel?: boolean;
  context?: 'desktop' | 'mobile';
}

export function InstallAppButton({
  className = '',
  showLabel = true,
  context = 'desktop',
}: InstallAppButtonProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstallButton, setShowInstallButton] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallButton(true);
    };

    // App installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallButton(false);
      toast.success('Aplicativo instalado com sucesso!');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleClick = async () => {
    if (!deferredPrompt) {
      // Se não tem evento (desktop/iOS), mostrar instruções
      showInstallInstructions();
      return;
    }

    // Chrome Android com evento
    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;

    if (choice.outcome === 'accepted') {
      setIsInstalled(true);
      setShowInstallButton(false);
    }

    setDeferredPrompt(null);
  };

  const showInstallInstructions = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isChrome = /chrome/.test(userAgent);

    if (isIOS) {
      toast.success('Toque em Compartilhar > Adicionar à Tela Inicial', {
        description: 'Para instalar em iOS',
      });
    } else if (isChrome) {
      toast.info('Clique no ícone de instalação na barra de endereço', {
        description: 'Ou use o menu (⋮) > Instalar app',
      });
    } else {
      toast.info('Use o menu do navegador para instalar este app', {
        description: 'A opção geralmente está no menu principal (⋮)',
      });
    }
  };

  // Se já está instalado, não mostrar botão
  if (isInstalled) {
    return null;
  }

  // Mostrar botão sempre (tenha evento ou não)
  return (
    <button
      onClick={handleClick}
      className={`flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-muted/50 ${className}`}
      aria-label="Instalar aplicativo"
      title={showInstallButton ? 'Instalar como aplicativo' : 'Ver instruções de instalação'}
    >
      <Download aria-hidden="true" className="h-4 w-4" />
      {showLabel && <span className="hidden sm:inline">Instalar aplicativo</span>}
    </button>
  );
}
