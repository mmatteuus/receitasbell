import { useState } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { usePendingSyncCount } from "../hooks/usePendingSyncCount";
import { useSyncNow } from "../hooks/useSyncNow";
import { useConflictCenter } from "../hooks/useConflictCenter";
import { ConflictResolutionDialog } from "./ConflictResolutionDialog";

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
  const [conflictOpen, setConflictOpen] = useState(false);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Centro de sincronização</DialogTitle>
            <DialogDescription>
              Acompanhe pendências e conflitos antes de sincronizar.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 text-sm">
            <div className="rounded-xl border p-3">
              <p className="font-medium">Alterações pendentes</p>
              <p className="mt-1 text-muted-foreground">
                {pendingCount === 0
                  ? "Tudo sincronizado."
                  : `${pendingCount} alteração(ões) salva(s) neste dispositivo aguardando envio.`}
              </p>
            </div>

            {conflicts.length > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/30">
                <div className="flex items-center gap-2 mb-1">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <p className="font-medium text-amber-900 dark:text-amber-100">
                    {conflicts.length} conflito(s) precisam de atenção
                  </p>
                </div>
                <p className="text-xs text-amber-700 dark:text-amber-300 mb-2">
                  Uma versão local e a versão do servidor estão em conflito. Escolha como resolver.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-amber-300 text-amber-800 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-200"
                  onClick={() => setConflictOpen(true)}
                >
                  Resolver conflitos
                </Button>
              </div>
            )}
          </div>

          <Button onClick={() => void syncNow()} disabled={syncing} className="w-full gap-2">
            <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Sincronizando..." : "Sincronizar agora"}
          </Button>
        </DialogContent>
      </Dialog>

      <ConflictResolutionDialog open={conflictOpen} onOpenChange={setConflictOpen} />
    </>
  );
}
