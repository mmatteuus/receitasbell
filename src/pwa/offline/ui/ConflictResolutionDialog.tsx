import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useConflictCenter } from "../hooks/useConflictCenter";

export function ConflictResolutionDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { conflicts, resolveConflict } = useConflictCenter();
  const firstConflict = conflicts[0];

  if (!firstConflict) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Conflito de sincronização</DialogTitle>
          <DialogDescription>
            Escolha como deseja resolver o rascunho local em conflito com a versão do servidor.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <div className="rounded-lg border p-3">
            <p className="font-medium">Local</p>
            <pre className="mt-2 overflow-auto whitespace-pre-wrap text-xs text-muted-foreground">
              {JSON.stringify(firstConflict.localPayload, null, 2)}
            </pre>
          </div>
          <div className="rounded-lg border p-3">
            <p className="font-medium">Servidor</p>
            <pre className="mt-2 overflow-auto whitespace-pre-wrap text-xs text-muted-foreground">
              {JSON.stringify(firstConflict.serverPayload, null, 2)}
            </pre>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button className="flex-1" variant="outline" onClick={() => void resolveConflict(firstConflict.conflictId, "server")}>
            Usar versão do servidor
          </Button>
          <Button className="flex-1" variant="outline" onClick={() => void resolveConflict(firstConflict.conflictId, "merge")}>
            Mesclar e revisar
          </Button>
          <Button className="flex-1" onClick={() => void resolveConflict(firstConflict.conflictId, "local")}>
            Manter rascunho local
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
