import { Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { usePwaInstall } from "@/hooks/use-pwa-install";

function isIos() {
  // iPadOS can report "MacIntel" but still be touch-capable.
  const ua = navigator.userAgent || "";
  const isAppleDevice = /iPad|iPhone|iPod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  return isAppleDevice;
}

export function AdminInstallPwaButton() {
  const { canInstall, promptInstall } = usePwaInstall();

  if (!canInstall) return null;

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="gap-2"
      onClick={() => {
        void (async () => {
          const result = await promptInstall();
          if (result.outcome === "unavailable") {
            if (isIos()) {
              toast.message("No iPhone/iPad: compartilhar > 'Adicionar a Tela de Inicio'.");
              return;
            }
            toast.message("Instalacao indisponivel neste navegador/estado.");
            return;
          }
          if (result.outcome === "dismissed") {
            toast.message("Instalacao cancelada.");
          }
        })();
      }}
      aria-label="Instalar app do painel admin"
      title="Instalar app do painel admin"
    >
      <Download className="h-4 w-4" />
      Instalar app
    </Button>
  );
}

