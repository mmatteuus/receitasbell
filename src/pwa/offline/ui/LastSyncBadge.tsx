import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function LastSyncBadge({ lastSyncedAt }: { lastSyncedAt?: string | null }) {
  if (!lastSyncedAt) {
    return null;
  }

  return (
    <div className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800">
      Última sincronização: {format(new Date(lastSyncedAt), "dd/MM HH:mm", { locale: ptBR })}
    </div>
  );
}
