import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePendingSyncCount } from "../hooks/usePendingSyncCount";

export function PendingChangesBar({
  onOpenSyncCenter,
}: {
  onOpenSyncCenter: () => void;
}) {
  const pendingCount = usePendingSyncCount();

  if (!pendingCount) {
    return null;
  }

  return (
    <div className="sticky top-[5.5rem] z-20 border-b border-primary/10 bg-primary/5 px-4 py-2">
      <div className="mx-auto flex max-w-md items-center justify-between gap-3">
        <p className="text-sm text-foreground">
          {pendingCount} alteração(ões) pendente(s) de sincronização
        </p>
        <Button variant="outline" size="sm" className="gap-2" onClick={onOpenSyncCenter}>
          <RefreshCw className="h-3.5 w-3.5" />
          Ver
        </Button>
      </div>
    </div>
  );
}
