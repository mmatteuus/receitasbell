'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FocusContainerProps {
  isFocused: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

export function FocusContainer({ isFocused, onClose, children, className }: FocusContainerProps) {
  // Bloqueia a rolagem do corpo da página quando o modo de foco está ativo
  useEffect(() => {
    if (isFocused) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isFocused]);

  // Adiciona suporte a ESC para sair do modo foco
  useEffect(() => {
    if (!isFocused) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFocused, onClose]);

  if (isFocused) {
    return (
      <div
        className="fixed inset-0 z-[100] overflow-y-auto bg-background/98 backdrop-blur-md p-4 sm:p-8 animate-in fade-in duration-300"
        role="dialog"
        aria-modal="true"
        aria-label="Modo leitura - Receita em tela cheia"
      >
        {/* Header com instruções claras */}
        <div className="fixed top-0 left-0 right-0 z-[102] print:hidden">
          <div className="mx-auto max-w-3xl px-4 sm:px-8 pt-4 flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs sm:text-sm text-muted-foreground font-medium flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse" />
                Modo Leitura Ativado
              </p>
            </div>
          </div>
        </div>

        {/* Botão de Saída com instruções visuais */}
        <div className="fixed top-4 right-4 z-[101] print:hidden flex flex-col items-end gap-2">
          <Button
            onClick={onClose}
            size="lg"
            className="gap-2 shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold animate-in fade-in slide-in-from-top-2 duration-300"
            aria-label="Fechar modo de leitura (ESC)"
          >
            <X aria-hidden="true" className="h-5 w-5" />
            <span className="hidden sm:inline">Sair</span>
          </Button>
          <p className="text-xs text-muted-foreground hidden sm:block">
            ou pressione{' '}
            <kbd className="bg-muted px-2 py-1 rounded border text-xs font-mono">ESC</kbd>
          </p>
        </div>

        {/* Conteúdo da Receita */}
        <div className={cn('mx-auto max-w-3xl pt-16 pb-20', className)}>{children}</div>
      </div>
    );
  }

  return <div className={className}>{children}</div>;
}
