import { useEffect, useState, useCallback } from 'react';
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

// Detecta tipo de navegador
function detectBrowser() {
  const userAgent = navigator.userAgent.toLowerCase();
  return {
    isIOS: /iphone|ipad|ipod/.test(userAgent),
    isAndroid: /android/.test(userAgent),
    isChrome: /chrome|chromium|crios/.test(userAgent) && !/edg/.test(userAgent),
    isEdge: /edg/.test(userAgent),
    isFirefox: /firefox/.test(userAgent),
    isSafari: /safari/.test(userAgent) && !/chrome|crios|android/.test(userAgent),
  };
}

export function InstallAppButton({
  className = '',
  showLabel = true,
  context = 'desktop',
}: InstallAppButtonProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstallButton, setShowInstallButton] = useState(false);


  const triggerInstallPrompt = useCallback(async (prompt: BeforeInstallPromptEvent | null) => {
    if (!prompt) return;

    try {
      await prompt.prompt();
      const choice = await prompt.userChoice;

      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
        setShowInstallButton(false);
        toast.success('Aplicativo instalado com sucesso!');
      } else if (choice.outcome === 'dismissed') {
        toast.info('Você pode instalar quando quiser clicando no botão de download', {
          description: 'A instalação é completamente opcional',
        });
      }

      setDeferredPrompt(null);
    } catch (error) {
      // Silenciar erro NotAllowedError (usuário cancelou ou algo similar)
      // Não quebra experiência em nenhum cenário
      if (error instanceof Error && !error.message.includes('NotAllowedError')) {
        console.error('Erro ao exibir prompt de instalação:', error);
      }
    }
  }, []);

  // Inicialização e setup de listeners
  useEffect(() => {
    // Verifica se app já está instalado
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Handler do evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const prompt = e as BeforeInstallPromptEvent;
      setDeferredPrompt(prompt);
      setShowInstallButton(true);

    };

    // Handler do evento appinstalled
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallButton(false);
      toast.success('Aplicativo instalado com sucesso!');
    };

    // Registra listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Cleanup
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [triggerInstallPrompt]);

  // Handler de clique no botão
  const handleClick = useCallback(async () => {
    if (deferredPrompt) {
      // Se tem evento deferred, dispara direto
      await triggerInstallPrompt(deferredPrompt);
      return;
    }

    // Sem evento: mostrar instruções específicas por browser
    const browser = detectBrowser();

    if (browser.isIOS) {
      toast.success('Toque em Compartilhar > Adicionar à Tela Inicial', {
        description: 'Para instalar em iOS (Safari)',
      });
    } else if (browser.isAndroid) {
      if (browser.isChrome) {
        toast.info('Verifique se o PWA está configurado corretamente', {
          description: 'Ou tente pelo menu do Chrome (⋮) > Instalar app',
        });
      } else if (browser.isFirefox) {
        toast.info('Use o menu (≡) > Instalar > Instalar site', {
          description: 'Para instalar como app no Firefox Android',
        });
      } else {
        toast.info('Use o menu do navegador para instalar este app', {
          description: 'A opção geralmente está no menu principal',
        });
      }
    } else if (browser.isChrome || browser.isEdge) {
      toast.info('Clique no ícone de instalação na barra de endereço', {
        description: 'Ou use o menu (⋮) > Instalar app',
      });
    } else if (browser.isFirefox) {
      toast.info('Use o menu (≡) > Instalar site', {
        description: 'Para instalar como web app no Firefox',
      });
    } else if (browser.isSafari) {
      toast.info('Use Arquivo > Adicionar à Dock', {
        description: 'Ou use o menu Compartilhar (↗)',
      });
    } else {
      toast.info('Use o menu do navegador para instalar este app', {
        description: 'A opção geralmente está no menu principal',
      });
    }
  }, [deferredPrompt, triggerInstallPrompt]);

  // Se já instalado, não renderiza nada
  if (isInstalled) {
    return null;
  }

  // Renderiza botão para todos os dispositivos
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
