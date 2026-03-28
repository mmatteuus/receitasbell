import { WifiOff } from "lucide-react";
import { useOfflineStatus } from "../hooks/useOfflineStatus";

export function OfflineBanner() {
  const { offline } = useOfflineStatus();

  if (!offline) {
    return null;
  }

  return (
    <div className="sticky top-14 z-30 border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">
      <div className="mx-auto flex max-w-md items-center gap-2">
        <WifiOff className="h-4 w-4" />
        <span>Sem conexão. Você está vendo dados salvos neste dispositivo.</span>
      </div>
    </div>
  );
}
