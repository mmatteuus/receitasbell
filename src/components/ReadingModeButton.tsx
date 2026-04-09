import { useState } from 'react';
import { Maximize2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ReadingModeButtonProps {
  onClick: () => void;
}

/**
 * Botão de Modo Leitura altamente intuitivo e auto-explicativo
 * Mostra um tooltip visual que deixa claro o que faz e com animações
 */
export function ReadingModeButton({ onClick }: ReadingModeButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <TooltipProvider>
      <Tooltip delayDuration={200} open={isHovered}>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            onClick={onClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="relative hover:border-primary hover:bg-primary/10 transition-all duration-200"
            aria-label="Ampliar receita - Modo Leitura sem distrações"
          >
            <Maximize2
              aria-hidden="true"
              className="h-4 w-4 transition-transform group-hover:scale-110"
            />
          </Button>
        </TooltipTrigger>
        <TooltipContent
          side="bottom"
          className="bg-primary text-primary-foreground font-medium max-w-xs"
        >
          <div className="flex flex-col gap-2 py-1">
            <div className="font-semibold text-sm">Ampliar Receita</div>
            <div className="text-xs opacity-90">Exibe a receita em tela cheia, sem distrações</div>
            <div className="flex items-center gap-1 text-xs opacity-75 mt-1">
              <X className="h-3 w-3" />
              <span>Clique o X para sair</span>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
