import { useState } from "react";
import { Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface FullscreenChartProps {
  title: string;
  children: React.ReactNode;
}

export function FullscreenChart({ title, children }: FullscreenChartProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        aria-label={`Expandir gráfico: ${title}`}
        className="shrink-0"
      >
        <Maximize2 className="h-4 w-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[95vw] w-[95vw] max-h-[90vh] h-[85vh] flex flex-col">
          <DialogHeader className="flex flex-row items-center justify-between shrink-0">
            <DialogTitle>{title}</DialogTitle>
            <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Recolher gráfico">
              <Minimize2 className="h-4 w-4" />
            </Button>
          </DialogHeader>
          <div className="flex-1 min-h-0 overflow-auto">
            {children}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
