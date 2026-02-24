"use client";

import { useEffect } from "react";
import { Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isFocused]);

  if (isFocused) {
    return (
      <div className="fixed inset-0 z-[100] overflow-y-auto bg-background/95 backdrop-blur-sm p-4 sm:p-8 animate-in fade-in duration-300">
        <div className="fixed top-4 right-4 z-[101] print:hidden">
           <Button variant="outline" size="sm" onClick={onClose} className="gap-2 shadow-md bg-background hover:bg-accent">
             <Minimize2 className="h-4 w-4" />
             Sair do Foco
           </Button>
        </div>
        <div className={cn("mx-auto max-w-3xl pt-12 pb-20", className)}>
          {children}
        </div>
      </div>
    );
  }

  return <div className={className}>{children}</div>;
}