import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePendingSyncCount } from "../hooks/usePendingSyncCount";

export function PendingChangesBar({
  onOpenSyncCenter,
  pendingCount,
}: {
  onOpenSyncCenter: () => void;
  pendingCount?: number;
}) {
  const runtimePendingCount = usePendingSyncCount();
  const count = typeof pendingCount === "number" ? pendingCount : runtimePendingCount;

  if (!count) {
    return null;
  }

  return (
    <div
      className="fixed inset-x-0 z-20 border-b border-primary/10 bg-primary/5 px-4 py-2"
      style={{ top: "calc(var(--pwa-topbar-height) + var(--pwa-offline-banner-height, 0px))" }}
      role="status"
      aria-live="polite"
    >
      <div className="mx-auto flex max-w-md items-center justify-between gap-3">
        <p className="text-sm text-foreground">
          {count} alteração(ões) pendente(s) de sincronização
        </p>
        <Button variant="outline" size="sm" className="gap-2" onClick={onOpenSyncCenter}>
          <RefreshCw className="h-3.5 w-3.5" />
          Ver
        </Button>
      </div>
    </div>
  );
}
