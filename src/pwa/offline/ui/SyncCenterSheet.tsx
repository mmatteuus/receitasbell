import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { usePendingSyncCount } from "../hooks/usePendingSyncCount";
import { useSyncNow } from "../hooks/useSyncNow";
import { useConflictCenter } from "../hooks/useConflictCenter";

export function SyncCenterSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const pendingCount = usePendingSyncCount();
  const { syncing, syncNow } = useSyncNow();
  const { conflicts } = useConflictCenter();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Centro de sincronização</DialogTitle>
          <DialogDescription>
            Acompanhe pendências, falhas e conflitos antes de forçar uma nova sincronização.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <div className="rounded-xl border p-3">
            <p className="font-medium">Pendências</p>
            <p className="mt-1 text-muted-foreground">{pendingCount} item(ns) aguardando envio.</p>
          </div>

          <div className="rounded-xl border p-3">
            <p className="font-medium">Conflitos</p>
            <p className="mt-1 text-muted-foreground">{conflicts.length} conflito(s) exigem revisão manual.</p>
          </div>
        </div>

        <Button onClick={() => void syncNow()} disabled={syncing}>
          {syncing ? "Sincronizando..." : "Sincronizar agora"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
